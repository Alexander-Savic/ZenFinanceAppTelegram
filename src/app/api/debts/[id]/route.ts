import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/session';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserId();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const debt = await prisma.debt.update({
      where: { id: params.id, userId: user.id },
      data: { status },
      include: { account: true },
    });

    return NextResponse.json(debt);
  } catch (error) {
    console.error('Error updating debt:', error);
    return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireUserId();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.debt.delete({
      where: { id: params.id, userId: user.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 });
  }
}