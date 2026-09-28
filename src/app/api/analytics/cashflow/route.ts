import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { resolvePeriodRange, bucketBoundaries, bucketKeyFor, type Period } from "@/lib/date-ranges";

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

  const period = (req.nextUrl.searchParams.get("period") ?? "month") as Period;
  if (!["week", "month", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const range = resolvePeriodRange(period);
  const boundaries = bucketBoundaries(range);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId,
      type: { in: ["INCOME", "EXPENSE"] },
      occurredAt: { gte: range.start, lte: range.end },
    },
    select: { type: true, amount: true, occurredAt: true },
  });

  // Bucketed here in application code: at this data volume (one period's
  // worth of transactions, max ~a few hundred rows) it's simpler and just as
  // fast as a date_trunc query. Revisit with $queryRaw if per-user history
  // grows into the tens of thousands of rows within a single period.
  const buckets = new Map(boundaries.map((b) => [b.key, { income: 0, expense: 0 }]));

  for (const t of transactions) {
    const key = bucketKeyFor(t.occurredAt, range.bucket);
    const bucket = buckets.get(key);
    if (!bucket) continue; // shouldn't happen given the range filter, but stay defensive
    if (t.type === "INCOME") bucket.income += Number(t.amount);
    else bucket.expense += Number(t.amount);
  }

  const series = boundaries.map((b) => {
    const bucket = buckets.get(b.key)!;
    return {
      label: b.label,
      income: Math.round(bucket.income * 100) / 100,
      expense: Math.round(bucket.expense * 100) / 100,
      net: Math.round((bucket.income - bucket.expense) * 100) / 100,
    };
  });

  const totals = series.reduce(
    (acc, p) => ({ income: acc.income + p.income, expense: acc.expense + p.expense }),
    { income: 0, expense: 0 }
  );

  return NextResponse.json({ period, series, totals });
}
