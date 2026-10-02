import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const updateAccountSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  type: z.enum(["CASH", "CARD", "CRYPTO", "SAVINGS", "INVESTMENT"]).optional(),
  currency: z.enum(["RUB", "USD", "EUR", "BYN", "USDT", "BTC", "ETH", "GBP", "KZT"]).optional(),
  balance: z.string().optional(),
  colorGradientStart: z.string().optional(),
  colorGradientEnd: z.string().optional(),
  iconKey: z.string().optional(),
  maskedNumber: z.string().max(20).optional(),
  monthlyLimit: z.string().optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
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

  const body = await req.json().catch(() => null);
  const parsed = updateAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.account.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Счет не найден" }, { status: 404 });
  }

  const updated = await prisma.account.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json({ account: serialize(updated) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
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

  const existing = await prisma.account.findFirst({
    where: { id: params.id, userId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Счет не найден" }, { status: 404 });
  }

  // Мягкое удаление (архивация)
  await prisma.account.update({
    where: { id: params.id },
    data: { isArchived: true },
  });

  return NextResponse.json({ success: true });
}

function serialize<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, v) =>
      v && typeof v === "object" && "toFixed" in v ? v.toString() : v
    )
  );
}