import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

// GET: Fetch currently logged-in user profile details
export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 444 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Fetch me error:', error);
    return NextResponse.json({ error: 'Failed to fetch user session' }, { status: 500 });
  }
}
