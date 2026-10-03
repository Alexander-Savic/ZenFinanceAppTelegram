// app/api/auth/telegram/route.ts
import { NextResponse } from "next/server";
import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function verifyTelegramInitData(telegramInitData: string, botToken: string) {
  const urlParams = new URLSearchParams(telegramInitData);
  const hash = urlParams.get("hash");
  urlParams.delete("hash");

  const paramsToSign: string[] = [];
  urlParams.forEach((val, key) => paramsToSign.push(`${key}=${val}`));
  paramsToSign.sort();

  const dataCheckString = paramsToSign.join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  return calculatedHash === hash;
}

export async function POST(req: Request) {
  try {
    const { initData } = await req.json();

    if (!initData) {
      return NextResponse.json({ error: "Missing initData" }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: "Bot token missing" }, { status: 500 });
    }

    const isValid = verifyTelegramInitData(initData, botToken);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Telegram data" }, { status: 401 });
    }

    const urlParams = new URLSearchParams(initData);
    const userJson = urlParams.get("user");
    if (!userJson) {
      return NextResponse.json({ error: "User data missing" }, { status: 400 });
    }

    const tgUser = JSON.parse(userJson);

    const user = await prisma.user.upsert({
      where: { telegramId: BigInt(tgUser.id) },
      update: {
        firstName: tgUser.first_name,
        lastName: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
      },
      create: {
        telegramId: BigInt(tgUser.id),
        firstName: tgUser.first_name,
        lastName: tgUser.last_name ?? null,
        username: tgUser.username ?? null,
      },
    });

    const sessionToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(sessionToken).digest("hex");
    const initDataHash = crypto.createHash("sha256").update(initData).digest("hex");

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 дней

    await prisma.session.create({
      data: {
        userId: user.id,
        tokenHash,
        initDataHash,
        expiresAt,
      },
    });

    const cookieStore = await cookies();
    cookieStore.set("zf_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
      path: "/",
    });

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        themeMode: user.themeMode,
        accentColor: user.accentColor,
        baseCurrency: user.baseCurrency,
      },
    });
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}