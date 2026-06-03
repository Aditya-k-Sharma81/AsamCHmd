import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';
import { Prisma } from '@prisma/client';

export async function PUT(request, props) {
  try {
    const params = await props.params;
    const { id } = params;

    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session || (session.role !== 'ADMIN' && session.role !== 'SELLER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body; // APPROVED (Accepted), REJECTED, SHIPPED, DELIVERED, COMPLETED

    if (!status || !['APPROVED', 'REJECTED', 'SHIPPED', 'DELIVERED', 'COMPLETED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Fetch the quotation with items
    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });

    if (!quotation) {
      return NextResponse.json({ error: 'Quotation not found' }, { status: 444 });
    }

    // If Seller, verify they own at least one product in this quotation
    if (session.role === 'SELLER') {
      const ownsProduct = quotation.items.some(item => item.product.sellerId === session.userId);
      if (!ownsProduct) {
        return NextResponse.json({ error: 'Forbidden: You do not own any products in this order' }, { status: 403 });
      }
    }

    // Deduct stock if the status is changing to APPROVED from PENDING/REJECTED
    if (status === 'APPROVED' && quotation.status !== 'APPROVED') {
      // Perform database checks and deduction in a transaction
      try {
        await prisma.$transaction(async (tx) => {
          for (const item of quotation.items) {
            const product = await tx.product.findUnique({
              where: { id: item.productId },
            });

            if (!product) {
              throw new Error(`Product "${item.product.name}" no longer exists.`);
            }

            const currentStock = new Prisma.Decimal(product.stockQuantity);
            const neededStock = new Prisma.Decimal(item.internalQuantity);

            if (currentStock.lt(neededStock)) {
              throw new Error(
                `Insufficient stock for "${product.name}". Required: ${neededStock.toString()} base units, Available: ${currentStock.toString()} base units.`
              );
            }

            // Deduct stock
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: currentStock.minus(neededStock).toNumber(),
              },
            });
          }

          // Update status
          await tx.quotation.update({
            where: { id },
            data: { status },
          });
        });
      } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    } else {
      // Just update status (e.g. REJECTED, COMPLETED, or if already APPROVED)
      await prisma.quotation.update({
        where: { id },
        data: { status },
      });
    }

    const updatedQuotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, address: true, phone: true } },
        items: { include: { product: true } },
      },
    });

    return NextResponse.json(updatedQuotation);
  } catch (error) {
    console.error('Update quotation status error:', error);
    return NextResponse.json({ error: 'Failed to update quotation status' }, { status: 500 });
  }
}
