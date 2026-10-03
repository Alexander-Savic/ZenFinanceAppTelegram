import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Decimal from "decimal.js";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { Prisma, TransactionType } from "@prisma/client";

const baseSchema = z.object({
  currency: z.enum([
    "RUB", "USD", "EUR", "BYN", "USDT", "BTC", "ETH", "GBP", "KZT",
  ]),
  amount: z.string().refine((v) => new Decimal(v).gt(0), "amount must be > 0"),
  description: z.string().max(500).optional(),
  occurredAt: z.string().datetime().optional(),
  tagIds: z.array(z.string()).optional(),
});

const incomeExpenseSchema = baseSchema.extend({
  type: z.enum(["INCOME", "EXPENSE"]),
  accountId: z.string(),
  categoryId: z.string().optional(),
});

const transferSchema = baseSchema.extend({
  type: z.literal("TRANSFER"),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  exchangeRate: z.string().optional(), 
});

const createTransactionSchema = z.discriminatedUnion("type", [
  incomeExpenseSchema.extend({ type: z.literal("INCOME") }),
  incomeExpenseSchema.extend({ type: z.literal("EXPENSE") }),
  transferSchema,
]);

export async function GET(req: NextRequest) {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { occurredAt: "desc" },
    take: limit,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    include: {
      category: { select: { id: true, name: true, iconKey: true, colorHex: true } },
      fromAccount: { select: { id: true, name: true } },
      toAccount: { select: { id: true, name: true } },
      tags: { include: { tag: true } },
    },
  });

  return NextResponse.json({
    transactions: transactions.map((tx) => serializeTransaction(tx)),
    nextCursor: transactions.length === limit ? transactions[transactions.length - 1]?.id ?? null : null,
  });
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
  const parsed = createTransactionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;
  const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
  const amount = new Decimal(input.amount);

  try {
    const result = await prisma.$transaction(async (tx) => {
      if (input.type === "TRANSFER") {
        if (input.fromAccountId === input.toAccountId) {
          throw new Prisma.PrismaClientKnownRequestError(
            "Cannot transfer to the same account",
            { code: "P_SAME_ACCOUNT", clientVersion: "n/a" }
          );
        }

        const [fromAccount, toAccount] = await Promise.all([
          tx.account.findFirstOrThrow({
            where: { id: input.fromAccountId, userId },
          }),
          tx.account.findFirstOrThrow({
            where: { id: input.toAccountId, userId },
          }),
        ]);

        const fromBalance = new Decimal(fromAccount.balance.toString());
        if (fromBalance.lt(amount)) {
          throw new InsufficientFundsError(fromAccount.id);
        }

        let creditedAmount = amount;
        let exchangeRate: Decimal | null = null;
        if (fromAccount.currency !== toAccount.currency) {
          if (!input.exchangeRate) {
            throw new MissingExchangeRateError();
          }
          exchangeRate = new Decimal(input.exchangeRate);
          creditedAmount = amount.mul(exchangeRate);
        }

        await tx.account.update({
          where: { id: fromAccount.id },
          data: { balance: fromBalance.minus(amount).toFixed(8) },
        });
        await tx.account.update({
          where: { id: toAccount.id },
          data: {
            balance: new Decimal(toAccount.balance.toString())
              .plus(creditedAmount)
              .toFixed(8),
          },
        });

        return tx.transaction.create({
          data: {
            userId,
            type: TransactionType.TRANSFER,
            amount: amount.toFixed(8),
            currency: input.currency,
            fromAccountId: fromAccount.id,
            toAccountId: toAccount.id,
            exchangeRate: exchangeRate ? exchangeRate.toFixed(8) : null,
            description: input.description,
            occurredAt,
            tags: input.tagIds
              ? { create: input.tagIds.map((tagId) => ({ tagId })) }
              : undefined,
          },
          include: { tags: { include: { tag: true } } },
        });
      }

      const account = await tx.account.findFirstOrThrow({
        where: { id: input.accountId, userId },
      });
      const currentBalance = new Decimal(account.balance.toString());

      if (input.type === "EXPENSE" && currentBalance.lt(amount)) {
        throw new InsufficientFundsError(account.id);
      }

      const newBalance =
        input.type === "INCOME"
          ? currentBalance.plus(amount)
          : currentBalance.minus(amount);

      await tx.account.update({
        where: { id: account.id },
        data: { balance: newBalance.toFixed(8) },
      });

      return tx.transaction.create({
        data: {
          userId,
          type: input.type,
          amount: amount.toFixed(8),
          currency: input.currency,
          fromAccountId: input.type === "EXPENSE" ? account.id : null,
          toAccountId: input.type === "INCOME" ? account.id : null,
          categoryId: input.categoryId,
          description: input.description,
          occurredAt,
          tags: input.tagIds
            ? { create: input.tagIds.map((tagId) => ({ tagId })) }
            : undefined,
        },
        include: { tags: { include: { tag: true } } },
      });
    });

    return NextResponse.json({ transaction: serializeTransaction(result) }, { status: 201 });
  } catch (err) {
    if (err instanceof InsufficientFundsError) {
      return NextResponse.json(
        { error: "Insufficient funds", accountId: err.accountId },
        { status: 422 }
      );
    }
    if (err instanceof MissingExchangeRateError) {
      return NextResponse.json(
        { error: "exchangeRate is required when converting between currencies" },
        { status: 400 }
      );
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    console.error("Transaction creation failed", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

class InsufficientFundsError extends Error {
  constructor(public accountId: string) {
    super("Insufficient funds");
  }
}
class MissingExchangeRateError extends Error {}

function serializeTransaction(t: Record<string, unknown>) {
  return JSON.parse(
    JSON.stringify(t, (_key, value) =>
      value && typeof value === "object" && "toFixed" in value
        ? (value as Decimal).toString()
        : value
    )
  );
}
