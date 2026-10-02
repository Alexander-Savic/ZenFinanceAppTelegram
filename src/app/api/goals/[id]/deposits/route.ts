import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id: goalId } = await params;

  try {
    const body = await req.json();
    const { amount, note } = body;

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: "Укажите корректную сумму пополнения" }, { status: 400 });
    }

    // Проверяем, принадлежит ли цель пользователю
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Копилка не найдена" }, { status: 404 });
    }

    const depositAmount = Number(amount);

    // Создаем депозит и обновляем текущую сумму в копилке
    const [deposit] = await prisma.$transaction([
      prisma.goalDeposit.create({
        data: {
          goalId,
          amount: depositAmount.toString(),
          note: note ? String(note) : undefined,
        },
      }),
      prisma.goal.update({
        where: { id: goalId },
        data: {
          currentAmount: (Number(goal.currentAmount) + depositAmount).toString(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, deposit });
  } catch (err) {
    console.error("Goal deposit error:", err);
    return NextResponse.json({ error: "Ошибка при пополнении копилки" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const { id: goalId } = await params;

  try {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });

    if (!goal) {
      return NextResponse.json({ error: "Копилка не найдена" }, { status: 404 });
    }

    const deposits = await prisma.goalDeposit.findMany({
      where: { goalId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(deposits);
  } catch (err) {
    console.error("Fetch goal deposits error:", err);
    return NextResponse.json({ error: "Ошибка при загрузке депозитов" }, { status: 500 });
  }
}