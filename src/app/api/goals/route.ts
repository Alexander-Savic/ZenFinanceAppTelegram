import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const createGoalSchema = z.object({
  name: z.string().min(1).max(60),
  targetAmount: z.string().refine((v) => Number(v) > 0),
  currency: z.enum(["RUB", "USD", "EUR", "BYN", "USDT", "BTC", "ETH", "GBP", "KZT"]),
  targetDate: z.string().datetime().optional(),
  iconKey: z.string().optional(),
  roundUpEnabled: z.boolean().default(false),
  roundUpAccountId: z.string().optional(),
  roundUpToNearest: z.string().optional(),
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

  const goals = await prisma.goal.findMany({
    where: { userId, status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ goals: serialize(goals) });
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
  const parsed = createGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  if (input.roundUpEnabled && (!input.roundUpAccountId || !input.roundUpToNearest)) {
    return NextResponse.json(
      { error: "roundUpAccountId and roundUpToNearest are required when roundUpEnabled is true" },
      { status: 400 }
    );
  }

  const goal = await prisma.goal.create({
    data: {
      userId,
      name: input.name,
      targetAmount: input.targetAmount,
      currency: input.currency,
      targetDate: input.targetDate ? new Date(input.targetDate) : undefined,
      iconKey: input.iconKey,
      roundUpEnabled: input.roundUpEnabled,
      roundUpAccountId: input.roundUpEnabled ? input.roundUpAccountId : undefined,
      roundUpToNearest: input.roundUpEnabled ? input.roundUpToNearest : undefined,
    },
  });

  return NextResponse.json({ goal: serialize(goal) }, { status: 201 });
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (v && typeof v === "object" && "toFixed" in v ? v.toString() : v))
  );
}
