import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const createBudgetSchema = z.object({
  name: z.string().min(1).max(60),
  categoryId: z.string().optional(), // omit = overall monthly budget
  limitAmount: z.string().refine((v) => Number(v) > 0),
  currency: z.enum(["RUB", "USD", "EUR", "BYN", "USDT", "BTC", "ETH", "GBP", "KZT"]),
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
});

export async function GET() {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const now = new Date();
  const budgets = await prisma.budget.findMany({
    where: { userId, periodEnd: { gte: now } }, 
    include: { category: { select: { id: true, name: true, iconKey: true, colorHex: true } } },
    orderBy: { periodStart: "asc" },
  });

  const withSpend = await Promise.all(
    budgets.map(async (budget) => {
      const spentAgg = await prisma.transaction.aggregate({
        where: {
          userId,
          type: "EXPENSE",
          occurredAt: { gte: budget.periodStart, lte: budget.periodEnd },
          ...(budget.categoryId ? { categoryId: budget.categoryId } : {}),
        },
        _sum: { amount: true },
      });
      const spent = Number(spentAgg._sum.amount ?? 0);
      const limit = Number(budget.limitAmount);
      return {
        ...serialize(budget),
        spent,
        percentUsed: limit > 0 ? Math.min(999, Math.round((spent / limit) * 100)) : 0,
      };
    })
  );

  return NextResponse.json({ budgets: withSpend });
}

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

  const body = await req.json().catch(() => null);
  const parsed = createBudgetSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const budget = await prisma.budget.create({
    data: {
      userId,
      name: input.name,
      categoryId: input.categoryId,
      limitAmount: input.limitAmount,
      currency: input.currency,
      periodStart: new Date(input.periodStart),
      periodEnd: new Date(input.periodEnd),
    },
    include: { category: { select: { id: true, name: true, iconKey: true, colorHex: true } } },
  });

  return NextResponse.json({ budget: { ...serialize(budget), spent: 0, percentUsed: 0 } }, { status: 201 });
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (v && typeof v === "object" && "toFixed" in v ? v.toString() : v))
  );
}
