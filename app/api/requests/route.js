import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../lib/db';
import { getSession } from '../../../lib/auth';

// GET: Fetch product requests
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let requests;

    if (session.role === 'ADMIN' || session.role === 'SELLER') {
      // Admins and Sellers can see all user requests
      requests = await prisma.productRequest.findMany({
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      // Users only see their own requests
      requests = await prisma.productRequest.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Fetch requests error:', error);
    return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 });
  }
}

// POST: Submit a product request (Users only)
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session || session.role !== 'USER') {
      return NextResponse.json({ error: 'Unauthorized: Only users can make requests' }, { status: 401 });
    }

    const body = await request.json();
    const { productName, dimension, requestedUnit, requestedQuantity, notes } = body;

    if (!productName || !dimension || !requestedUnit) {
      return NextResponse.json({ error: 'Product name, dimension, and unit are required' }, { status: 400 });
    }

    const qty = requestedQuantity ? parseFloat(requestedQuantity) : null;

    const newRequest = await prisma.productRequest.create({
      data: {
        userId: session.userId,
        productName: productName.trim(),
        dimension,
        requestedUnit,
        requestedQuantity: qty,
        notes: notes?.trim(),
        status: 'PENDING',
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error('Create request error:', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}
