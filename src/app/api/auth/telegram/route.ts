import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// Валидация initData от Telegram Mini App
function verifyTelegramWebAppData(telegramInitData: string): { isOk: boolean; user?: any } {
  const urlParams = new URLSearchParams(telegramInitData);
  const hash = urlParams.get('hash');
  if (!hash) return { isOk: false };

  urlParams.delete('hash');

  const params: string[] = [];
  for (const [key, value] of urlParams.entries()) {
    params.push(`${key}=${value}`);
  }
  params.sort();

  const dataCheckString = params.join('\n');
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(process.env.TELEGRAM_BOT_TOKEN || '')
    .digest();

  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');

  if (calculatedHash !== hash) return { isOk: false };

  const userParam = urlParams.get('user');
  const user = userParam ? JSON.parse(userParam) : null;

  return { isOk: true, user };
}

export async function POST(request: Request) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json({ error: 'Missing initData' }, { status: 400 });
    }

    const { isOk, user: tgUser } = verifyTelegramWebAppData(initData);

    if (!isOk || !tgUser) {
      return NextResponse.json({ error: 'Invalid Telegram data' }, { status: 401 });
    }

    const telegramId = BigInt(tgUser.id);

    // Ищем пользователя по telegramId или создаём нового
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username: tgUser.username || null,
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        photoUrl: tgUser.photo_url || null,
      },
      create: {
        telegramId,
        username: tgUser.username || null,
        firstName: tgUser.first_name || null,
        lastName: tgUser.last_name || null,
        photoUrl: tgUser.photo_url || null,
      },
    });

    // Создаём долгоживущую сессию (на 30 дней)
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(sessionToken).digest('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        initDataHash: crypto.createHash('sha256').update(initData).digest('hex'),
        expiresAt,
      },
    });

    // Отправляем токен в зашифрованной/защищенной httpOnly куке
    const response = NextResponse.json({ success: true, user });
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Telegram auth error:', error);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }
}