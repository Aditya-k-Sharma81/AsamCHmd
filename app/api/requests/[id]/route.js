import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import prisma from '../../../../lib/db';
import { getSession } from '../../../../lib/auth';

// PUT: Update request status (Admin only)
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
    const { status } = body; // PENDING_ADMIN, APPROVED_BY_ADMIN, ADDED

    if (!status || !['PENDING_ADMIN', 'APPROVED_BY_ADMIN', 'ADDED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedRequest = await prisma.productRequest.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    console.error('Update request error:', error);
    return NextResponse.json({ error: 'Failed to update request' }, { status: 500 });
  }
}

// DELETE: Delete a request (Admin only)
export async function DELETE(request, props) {
  try {
    const params = await props.params;
    const { id } = params;

    const cookieStore = await cookies();
    const session = await getSession(cookieStore);
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.productRequest.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Request deleted successfully' });
  } catch (error) {
    console.error('Delete request error:', error);
    return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 });
  }
}
