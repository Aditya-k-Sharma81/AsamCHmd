import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../lib/db';
import { getSession } from '../../../lib/auth';
import { toInternalQuantity, UNITS } from '../../../lib/conversion';

// GET all products (with search/filter)
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const dimension = searchParams.get('dimension') || '';
    const sellerId = searchParams.get('sellerId') || '';

    const where = {};

    // If user is a SELLER, they can ONLY view their own products
    if (session.role === 'SELLER') {
      where.sellerId = session.userId;
    } else if (sellerId) {
      // Admins/Users can filter by a specific seller
      where.sellerId = sellerId;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (dimension) {
      where.dimension = dimension;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        seller: { select: { name: true, email: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST: Create product (Admin or Seller only)
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session || !['ADMIN', 'SELLER'].includes(session.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sku, name, description, category, dimension, baseUnit, basePrice, initialStock, targetSellerId } = body;

    if (!sku || !name || !dimension || !baseUnit || basePrice === undefined || initialStock === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify unique SKU
    const existingProduct = await prisma.product.findUnique({
      where: { sku: sku.trim() },
    });

    if (existingProduct) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    // Validate units config
    const unitConfig = UNITS[baseUnit];
    if (!unitConfig) {
      return NextResponse.json({ error: `Invalid unit: ${baseUnit}` }, { status: 400 });
    }
    if (unitConfig.dimension !== dimension) {
      return NextResponse.json({ error: 'Unit does not match dimension' }, { status: 400 });
    }

    // Determine owner (sellerId)
    // If admin and targetSellerId is provided, use it, else use own userId
    let productSellerId = session.userId;
    if (session.role === 'ADMIN' && targetSellerId) {
      productSellerId = targetSellerId;
    }

    // Convert stock to internal quantity
    const internalStock = toInternalQuantity(initialStock, baseUnit);

    // Create the product
    const product = await prisma.product.create({
      data: {
        sku: sku.trim(),
        name: name.trim(),
        description: description?.trim(),
        category: category?.trim(),
        dimension,
        baseUnit,
        basePrice: parseFloat(basePrice),
        stockQuantity: internalStock.toNumber(),
        sellerId: productSellerId,
      },
    });

    // Notification Hook: If stock is positive, notify users who requested this product
    if (parseFloat(initialStock) > 0) {
      const pendingRequests = await prisma.productRequest.findMany({
        where: {
          productName: { equals: name.trim(), mode: 'insensitive' },
          status: { in: ['PENDING_ADMIN', 'APPROVED_BY_ADMIN'] },
        },
      });

      if (pendingRequests.length > 0) {
        const notificationPromises = pendingRequests.map((req) =>
          prisma.notification.create({
            data: {
              userId: req.userId,
              title: 'Requested Product Available',
              message: `Good news! The product "${name}" you requested is now available. Stock: ${initialStock} ${baseUnit}.`,
            },
          })
        );

        const updateRequestPromises = pendingRequests.map((req) =>
          prisma.productRequest.update({
            where: { id: req.id },
            data: { status: 'ADDED' },
          })
        );

        await Promise.all([...notificationPromises, ...updateRequestPromises]);
      }
    }

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
