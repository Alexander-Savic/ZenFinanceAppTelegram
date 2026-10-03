import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";
import { resolvePeriodRange, type Period } from "@/lib/date-ranges";

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

  const params = req.nextUrl.searchParams;
  const period = (params.get("period") ?? "month") as Period;
  const type = params.get("type") === "INCOME" ? "INCOME" : "EXPENSE";
  if (!["week", "month", "year"].includes(period)) {
    return NextResponse.json({ error: "Invalid period" }, { status: 400 });
  }

  const { start, end } = resolvePeriodRange(period);

  const grouped = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      type,
      occurredAt: { gte: start, lte: end },
      categoryId: { not: null },
    },
    _sum: { amount: true },
  });

  const categoryIds = grouped.map((g) => g.categoryId).filter((id): id is string => !!id);
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true, colorHex: true, iconKey: true },
  });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  const total = grouped.reduce((sum, g) => sum + Number(g._sum.amount ?? 0), 0);

  const breakdown = grouped
    .map((g) => {
      const category = g.categoryId ? categoryById.get(g.categoryId) : undefined;
      const amount = Number(g._sum.amount ?? 0);
      return {
        categoryId: g.categoryId,
        name: category?.name ?? "Без категории",
        colorHex: category?.colorHex ?? "#6b7280",
        iconKey: category?.iconKey ?? "circle",
        amount,
        percent: total > 0 ? Math.round((amount / total) * 1000) / 10 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount);

  return NextResponse.json({ period, type, total, breakdown });
}
