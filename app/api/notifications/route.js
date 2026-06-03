import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../lib/db';
import { getSession } from '../../../lib/auth';

// GET: Fetch notifications for the authenticated user
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PUT: Mark notifications as read
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { id } = body;

    if (id) {
      // Mark specific notification as read
      await prisma.notification.update({
        where: { id, userId: session.userId },
        data: { isRead: true },
      });
    } else {
      // Mark all notifications as read for this user
      await prisma.notification.updateMany({
        where: { userId: session.userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
