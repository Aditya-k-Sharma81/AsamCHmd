import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

// GET: List all sellers in the system (Admin only)
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const sellers = await prisma.user.findMany({
      where: { role: 'SELLER' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(sellers);
  } catch (error) {
    console.error('Fetch sellers error:', error);
    return NextResponse.json({ error: 'Failed to fetch sellers' }, { status: 500 });
  }
}
