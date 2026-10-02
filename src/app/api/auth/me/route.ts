import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/session';

export async function GET() {
  try {
    const user = await requireUserId();

    if (!user || typeof user !== 'object') {
      return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
    }

    const userObj = user as Record<string, any>;

    return NextResponse.json({
      user: {
        id: userObj.id,
        telegramId: userObj.telegramId ? userObj.telegramId.toString() : null,
        firstName: userObj.firstName,
        lastName: userObj.lastName ?? null,
        username: userObj.username ?? null,
        themeMode: userObj.themeMode,
        accentColor: userObj.accentColor,
        baseCurrency: userObj.baseCurrency ?? "USD",
      },
    });
  } catch (err) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
}
