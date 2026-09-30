import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';

export async function GET() {
  const user = await requireUserId();
  if (!user) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  // Преобразуем BigInt для JSON-ответа
  return NextResponse.json({
    ...user,
    telegramId: user.telegramId ? user.telegramId.toString() : null,
  });
}