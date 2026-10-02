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
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const accounts = await prisma.account.findMany({ where: { userId, isArchived: false } });
  const goals = await prisma.goal.findMany({ where: { userId, status: "IN_PROGRESS" } });
  const recentTransactions = await prisma.transaction.findMany({
    where: { userId },
    take: 10,
    orderBy: { createdAt: "desc" },
  });

  const contextPrompt = `Ты — персональный ИИ-ассистент по финансовому учету ZenFinance.
Данные пользователя:
- Счета: ${JSON.stringify(
    accounts.map((a) => ({ name: a.name, balance: a.balance, currency: a.currency }))
  )}
- Накопительные цели: ${JSON.stringify(
    goals.map((g) => ({ name: g.name, target: g.targetAmount, current: g.currentAmount }))
  )}
- Последние 10 операций: ${JSON.stringify(
    recentTransactions.map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.categoryId,
      date: t.createdAt,
    }))
  )}

Отвечай вежливо, лаконично и структурировано. Давай полезные финансовые советы на основе имеющихся данных.`;

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        reply: "ИИ-ассистент работает в демо-режиме. Для подключения добавьте OPENAI_API_KEY в файл .env.",
      });
    }

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: contextPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || "Не удалось получить ответ от ИИ.";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("AI Assistant error:", err);
    return NextResponse.json({ error: "Ошибка ИИ-сервиса" }, { status: 500 });
  }
}