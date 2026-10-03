import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const patchSchema = z.object({ status: z.enum(["ACTIVE", "PAUSED"]) });

async function getUserId(): Promise<string | NextResponse> {
  try {
    return await requireUserId();
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await prisma.subscription.updateMany({
    where: { id, userId, status: { not: "CANCELLED" } },
    data: { status: parsed.data.status },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getUserId();
  if (userId instanceof NextResponse) return userId;

  const { id } = await params;
  const result = await prisma.subscription.updateMany({
    where: { id, userId },
    data: { status: "CANCELLED" },
  });
  if (result.count === 0) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}