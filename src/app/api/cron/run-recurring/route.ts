import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Decimal from "decimal.js";
import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns";
import { TransactionType } from "@prisma/client";

/**
 * Vercel Cron target. Configure in vercel.json, e.g.:
 *   { "crons": [{ "path": "/api/cron/run-recurring", "schedule": "0 * * * *" }] }
 * Runs hourly; each subscription only fires once its nextRunAt has passed.
 */
function advance(date: Date, interval: string): Date {
  switch (interval) {
    case "DAILY": return addDays(date, 1);
    case "WEEKLY": return addWeeks(date, 1);
    case "BIWEEKLY": return addWeeks(date, 2);
    case "MONTHLY": return addMonths(date, 1);
    case "QUARTERLY": return addQuarters(date, 1);
    case "YEARLY": return addYears(date, 1);
    default: throw new Error(`Unknown interval: ${interval}`);
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const due = await prisma.subscription.findMany({
    where: { status: "ACTIVE", nextRunAt: { lte: new Date() } },
    include: { account: true },
  });

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const sub of due) {
    try {
      await prisma.$transaction(async (tx) => {
        const account = await tx.account.findUniqueOrThrow({ where: { id: sub.accountId } });
        const amount = new Decimal(sub.amount.toString());
        const balance = new Decimal(account.balance.toString());

        const newBalance =
          sub.type === "INCOME" ? balance.plus(amount) : balance.minus(amount);

        await tx.account.update({
          where: { id: account.id },
          data: { balance: newBalance.toFixed(8) },
        });

        await tx.transaction.create({
          data: {
            userId: sub.userId,
            type: sub.type as TransactionType,
            amount: amount.toFixed(8),
            currency: sub.currency,
            fromAccountId: sub.type === "EXPENSE" ? account.id : null,
            toAccountId: sub.type === "INCOME" ? account.id : null,
            description: `${sub.name} (auto)`,
            occurredAt: new Date(),
            subscriptionId: sub.id,
          },
        });

        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            lastRunAt: new Date(),
            nextRunAt: advance(sub.nextRunAt, sub.interval),
          },
        });
      });
      results.push({ id: sub.id, ok: true });
    } catch (err) {
      console.error(`Recurring run failed for subscription ${sub.id}`, err);
      results.push({ id: sub.id, ok: false, error: (err as Error).message });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
