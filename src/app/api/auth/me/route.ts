import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';

export async function GET() {
  const user = await requireUserId();
  
  if (!user || typeof user !== 'object') {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }

  const userObj = user as Record<string, any>;

  return NextResponse.json({
    ...userObj,
    telegramId: userObj.telegramId ? userObj.telegramId.toString() : null,
  });
}
