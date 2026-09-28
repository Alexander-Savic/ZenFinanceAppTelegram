import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const createTagSchema = z.object({
  name: z.string().min(1).max(30),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
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

  const tags = await prisma.tag.findMany({ where: { userId }, orderBy: { name: "asc" } });
  return NextResponse.json({ tags });
}

// Get-or-create: the tag picker lets users type a brand-new tag inline
// without a separate "manage tags" screen, so creation must be idempotent
// on (userId, name) — the schema's @@unique enforces this at the DB level.
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
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const tag = await prisma.tag.upsert({
    where: { userId_name: { userId, name: parsed.data.name } },
    update: {},
    create: { userId, name: parsed.data.name, colorHex: parsed.data.colorHex },
  });

  return NextResponse.json({ tag }, { status: 201 });
}
