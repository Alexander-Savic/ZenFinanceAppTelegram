import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { message } = await req.json().catch(() => ({}));
  if (!message) {
    return NextResponse.json({ error: "Сообщение не должно быть пустым" }, { status: 400 });
  }

  try {
    const accounts = await prisma.account.findMany({ where: { userId, isArchived: false } });
    const goals = await prisma.goal.findMany({ where: { userId, status: "IN_PROGRESS" } });
    const recentTransactions = await prisma.transaction.findMany({
      where: { userId },
      take: 10,
      orderBy: { createdAt: "desc" },
    });

    // Безопасная сериализация Decimal типов Prisma
    const cleanAccounts = accounts.map((a) => ({
      name: a.name,
      balance: a.balance.toString(),
      currency: a.currency,
    }));

    const cleanGoals = goals.map((g) => ({
      name: g.name,
      target: g.targetAmount.toString(),
      current: g.currentAmount.toString(),
    }));

    const cleanTx = recentTransactions.map((t) => ({
      type: t.type,
      amount: t.amount.toString(),
      category: t.categoryId,
      date: t.createdAt,
    }));

    const contextPrompt = `Ты — финансовый ассистент приложения ZenFinance.
Данные пользователя:
- Счета: 
${JSON.stringify(cleanAccounts)}
- Накопительные цели: 
${JSON.stringify(cleanGoals)}
- Последние 10 операций: 
${JSON.stringify(cleanTx)}

Отвечай кратко, доброжелательно и по делу на русском языке.`;

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "Укажите OPENROUTER_API_KEY в файле .env.local или в настройках Vercel.",
      });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "ZenFinance",
      },
      body: JSON.stringify({
        model: "qwen/qwen-2.5-coder-32b-instruct:free",
        messages: [
          { role: "system", content: contextPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OpenRouter API Error:", res.status, errorText);
      return NextResponse.json({
        reply: `Ошибка ИИ (${res.status}): Не удалось обработать запрос через OpenRouter.`,
      });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Не удалось получить ответ от ассистента.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI Assistant Error:", err);
    return NextResponse.json({ error: "Ошибка сервиса ИИ" }, { status: 500 });
  }
}