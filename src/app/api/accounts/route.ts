import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const createAccountSchema = z.object({
  name: z.string().min(1).max(60),
  type: z.enum(["CASH", "CARD", "CRYPTO", "SAVINGS", "INVESTMENT"]),
  currency: z.enum(["RUB", "USD", "EUR", "BYN", "USDT", "BTC", "ETH", "GBP", "KZT"]),
  initialBalance: z.string().optional().default("0"),
  colorGradientStart: z.string().optional(),
  colorGradientEnd: z.string().optional(),
  iconKey: z.string().optional(),
  maskedNumber: z.string().max(20).optional(),
  monthlyLimit: z.string().optional(),
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

  const accounts = await prisma.account.findMany({
    where: { userId, isArchived: false },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  return NextResponse.json({ accounts: serialize(accounts) });
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
  const parsed = createAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const input = parsed.data;

  const account = await prisma.account.create({
    data: {
      userId,
      name: input.name,
      type: input.type,
      currency: input.currency,
      balance: input.initialBalance,
      colorGradientStart: input.colorGradientStart,
      colorGradientEnd: input.colorGradientEnd,
      iconKey: input.iconKey,
      maskedNumber: input.maskedNumber,
      monthlyLimit: input.monthlyLimit,
    },
  });

  return NextResponse.json({ account: serialize(account) }, { status: 201 });
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      v && typeof v === "object" && "toFixed" in v ? v.toString() : v
    )
  );
}
