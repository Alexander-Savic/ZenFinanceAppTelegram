import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireUserId } from '@/lib/session';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params; // Развернули id через await
  try {
    const user = await requireUserId();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    const debt = await prisma.debt.update({
      where: { id: id, userId: user.id }, // Исправлено: заменили params.id на id
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
  { params }: { params: Promise<{ id: string }> } // Исправлено: добавили Promise
) {
  const { id } = await params; // Исправлено: развернули id через await
  try {
    const user = await requireUserId();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.debt.delete({
      where: { id: id, userId: user.id }, // Исправлено: заменили params.id на id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting debt:', error);
    return NextResponse.json({ error: 'Failed to delete debt' }, { status: 500 });
  }
}
