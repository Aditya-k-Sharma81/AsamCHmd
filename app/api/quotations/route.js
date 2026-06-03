import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../lib/db';
import { getSession } from '../../../lib/auth';
import { toInternalQuantity, calculateItemPrice } from '../../../lib/conversion';
import { Prisma } from '@prisma/client';

// GET: Fetch quotations
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let quotations;

    if (session.role === 'ADMIN') {
      // Admin sees all quotations with user info and all products
      quotations = await prisma.quotation.findMany({
        include: {
          user: { select: { name: true, email: true, address: true, phone: true } },
          items: { include: { product: { include: { seller: { select: { name: true, email: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (session.role === 'SELLER') {
      // Seller sees quotations containing at least one of their products
      // We filter the items relation to only include items belonging to this seller
      quotations = await prisma.quotation.findMany({
        where: {
          items: {
            some: {
              product: {
                sellerId: session.userId,
              },
            },
          },
        },
        include: {
          user: { select: { name: true, email: true, address: true, phone: true } },
          items: {
            where: {
              product: {
                sellerId: session.userId,
              },
            },
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // User sees their own quotations
      quotations = await prisma.quotation.findMany({
        where: { userId: session.userId },
        include: {
          items: { include: { product: { include: { seller: { select: { name: true, email: true } } } } } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(quotations);
  } catch (error) {
    console.error('Fetch quotations error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}

// POST: Place a quotation (Users only)
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session || session.role !== 'USER') {
      return NextResponse.json({ error: 'Unauthorized: Only users can place orders' }, { status: 401 });
    }

    const body = await request.json();
    const { items } = body; // Array of { productId, orderQuantity, orderUnit }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items selected' }, { status: 400 });
    }

    // Prepare quotation items and group by sellerId
    const itemsBySeller = {};

    for (const item of items) {
      const { productId, orderQuantity, orderUnit } = item;

      if (!productId || orderQuantity === undefined || !orderUnit) {
        return NextResponse.json({ error: 'Invalid item parameters' }, { status: 400 });
      }

      const qVal = parseFloat(orderQuantity);
      if (isNaN(qVal) || qVal <= 0) {
        return NextResponse.json({ error: 'Quantity must be positive' }, { status: 400 });
      }

      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 444 });
      }

      // Convert order quantity to internal base unit for stock check
      const internalQty = toInternalQuantity(orderQuantity, orderUnit);

      // Check stock availability
      const stockAvailable = new Prisma.Decimal(product.stockQuantity);
      if (internalQty.gt(stockAvailable)) {
        const availableInOrderUnit = stockAvailable.div(
          orderUnit === 'kg' || orderUnit === 'L' ? 1000 : 1
        );
        return NextResponse.json({
          error: `Insufficient stock for "${product.name}". Available: ${availableInOrderUnit.toFixed(4)} ${orderUnit}.`,
        }, { status: 400 });
      }

      // Calculate calculatedPrice in INR
      const itemPrice = calculateItemPrice(orderQuantity, orderUnit, product.basePrice, product.baseUnit);

      const sellerId = product.sellerId;
      if (!itemsBySeller[sellerId]) {
        itemsBySeller[sellerId] = [];
      }

      itemsBySeller[sellerId].push({
        productId,
        orderUnit,
        orderQuantity: new Prisma.Decimal(orderQuantity),
        internalQuantity: internalQty,
        calculatedPrice: itemPrice,
      });
    }

    // Save in transaction - create one quotation per seller
    const createdQuotations = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const sellerId of Object.keys(itemsBySeller)) {
        const sellerItems = itemsBySeller[sellerId];
        let sellerTotal = new Prisma.Decimal(0);
        sellerItems.forEach(item => {
          sellerTotal = sellerTotal.plus(item.calculatedPrice);
        });

        const q = await tx.quotation.create({
          data: {
            userId: session.userId,
            totalAmount: sellerTotal,
            status: 'PENDING',
            items: {
              create: sellerItems.map(item => ({
                productId: item.productId,
                orderUnit: item.orderUnit,
                orderQuantity: item.orderQuantity,
                internalQuantity: item.internalQuantity,
                calculatedPrice: item.calculatedPrice,
              })),
            },
          },
          include: {
            items: { include: { product: true } },
          },
        });
        results.push(q);
      }
      return results;
    });

    return NextResponse.json(createdQuotations[0] || {}, { status: 201 });
  } catch (error) {
    console.error('Create quotation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to place quotation' }, { status: 500 });
  }
}
