import { NextResponse } from "next/server";
import { z } from "zod";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const depositSchema = z.object({
  amount: z.string().refine((v) => new Decimal(v).gt(0)),
  note: z.string().max(200).optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = depositSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const goal = await prisma.$transaction(async (tx) => {
      const existing = await tx.goal.findFirstOrThrow({ where: { id, userId } });
      const amount = new Decimal(parsed.data.amount);
      const newAmount = new Decimal(existing.currentAmount.toString()).plus(amount);
      const reachedTarget = newAmount.gte(new Decimal(existing.targetAmount.toString()));

      await tx.goalDeposit.create({
        data: { goalId: id, amount: amount.toFixed(8), note: parsed.data.note },
      });

      return tx.goal.update({
        where: { id },
        data: {
          currentAmount: newAmount.toFixed(8),
          status: reachedTarget ? "COMPLETED" : existing.status,
        },
      });
    });

    return NextResponse.json({ goal: serialize(goal) }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (v && typeof v === "object" && "toFixed" in v ? v.toString() : v))
  );
}
