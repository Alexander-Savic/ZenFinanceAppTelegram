import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const updateGoalSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  targetAmount: z.string().optional(),
  currency: z.enum(["RUB", "USD", "EUR", "BYN", "USDT", "BTC", "ETH", "GBP", "KZT"]).optional(),
  targetDate: z.string().optional().nullable(),
  iconKey: z.string().optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED", "ARCHIVED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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
  const parsed = updateGoalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const updated = await prisma.goal.updateMany({
    where: { id, userId },
    data: {
      ...data,
      targetDate: data.targetDate !== undefined ? (data.targetDate ? new Date(data.targetDate) : null) : undefined,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  const goal = await prisma.goal.findUnique({ where: { id } });
  return NextResponse.json({ goal: serialize(goal) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  // Проверяем существование цели у текущего пользователя
  const goal = await prisma.goal.findFirst({
    where: { id, userId },
  });

  if (!goal) {
    return NextResponse.json({ error: "Цель не найдена" }, { status: 404 });
  }

  // Безопасное каскадное удаление депозитов и самой цели через транзакцию
  await prisma.$transaction([
    prisma.goalDeposit.deleteMany({ where: { goalId: id } }),
    prisma.goal.delete({ where: { id } }),
  ]);

  return NextResponse.json({ success: true });
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      v && typeof v === "object" && "toFixed" in v ? v.toString() : v
    )
  );
}