import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';
import { toInternalQuantity, UNITS } from '../../../../lib/conversion';

// PUT: Update product (Admin only)
export async function PUT(request, props) {
  try {
    const params = await props.params;
    const { id } = params;

    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { sku, name, description, category, dimension, baseUnit, basePrice, stockQuantity } = body;

    if (!sku || !name || !dimension || !baseUnit || basePrice === undefined || stockQuantity === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify product exists
    const currentProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!currentProduct) {
      return NextResponse.json({ error: 'Product not found' }, { status: 444 });
    }

    // Validate units config
    const unitConfig = UNITS[baseUnit];
    if (!unitConfig) {
      return NextResponse.json({ error: `Invalid unit: ${baseUnit}` }, { status: 400 });
    }
    if (unitConfig.dimension !== dimension) {
      return NextResponse.json({ error: 'Unit does not match dimension' }, { status: 400 });
    }

    // Check unique SKU (excluding self)
    const existingSku = await prisma.product.findFirst({
      where: {
        sku: sku.trim(),
        id: { not: id },
      },
    });

    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists on another product' }, { status: 400 });
    }

    // Convert new stock to internal quantity
    const internalStock = toInternalQuantity(stockQuantity, baseUnit);
    const newStockNum = internalStock.toNumber();
    const oldStockNum = Number(currentProduct.stockQuantity);

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        sku: sku.trim(),
        name: name.trim(),
        description: description?.trim(),
        category: category?.trim(),
        dimension,
        baseUnit,
        basePrice: parseFloat(basePrice),
        stockQuantity: newStockNum,
      },
    });

    // Restock Notification Hook: if stock went from 0 (or below) to positive
    if (oldStockNum <= 0 && newStockNum > 0) {
      // Find pending requests for a matching product name (case-insensitive)
      const pendingRequests = await prisma.productRequest.findMany({
        where: {
          productName: { equals: name.trim(), mode: 'insensitive' },
          status: 'PENDING',
        },
      });

      if (pendingRequests.length > 0) {
        // Create notifications for each user
        const notificationPromises = pendingRequests.map((req) =>
          prisma.notification.create({
            data: {
              userId: req.userId,
              title: 'Requested Product Restocked',
              message: `Good news! The product "${name}" you requested is now restocked and available. Stock: ${stockQuantity} ${baseUnit}.`,
            },
          })
        );

        // Update requests status to ADDED
        const updateRequestPromises = pendingRequests.map((req) =>
          prisma.productRequest.update({
            where: { id: req.id },
            data: { status: 'ADDED' },
          })
        );

        await Promise.all([...notificationPromises, ...updateRequestPromises]);
      }
    }

    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE: Delete product (Admin only)
export async function DELETE(request, props) {
  try {
    const params = await props.params;
    const { id } = params;

    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 444 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
