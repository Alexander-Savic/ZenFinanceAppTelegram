import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

export async function DELETE(
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

  const { id } = await params;

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 });
    }

    const amount = Number(transaction.amount);

    if (transaction.fromAccountId) {
      const account = await prisma.account.findUnique({
        where: { id: transaction.fromAccountId },
      });

      if (account) {
        const currentBalance = Number(account.balance);
        const newBalance =
          transaction.type === "INCOME"
            ? currentBalance - amount
            : currentBalance + amount;

        await prisma.account.update({
          where: { id: account.id },
          data: { balance: newBalance.toString() },
        });
      }
    }

    if (transaction.toAccountId && transaction.type === "TRANSFER") {
      const toAccount = await prisma.account.findUnique({
        where: { id: transaction.toAccountId },
      });

      if (toAccount) {
        const currentBalance = Number(toAccount.balance);
        await prisma.account.update({
          where: { id: toAccount.id },
          data: { balance: (currentBalance - amount).toString() },
        });
      }
    }

    await prisma.transaction.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete transaction error:", err);
    return NextResponse.json({ error: "Ошибка при удалении" }, { status: 500 });
  }
}