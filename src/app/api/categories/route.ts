import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUserId, UnauthorizedError } from "@/lib/session";

const createCategorySchema = z.object({
  name: z.string().min(1).max(40),
  type: z.enum(["INCOME", "EXPENSE"]),
  iconKey: z.string().min(1),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  parentId: z.string().optional(),
});

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

  const type = req.nextUrl.searchParams.get("type");
  const parsedType = type === "INCOME" || type === "EXPENSE" ? type : undefined;

  const categories = await prisma.category.findMany({
    where: { userId, ...(parsedType ? { type: parsedType } : {}) },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ categories });
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
  const parsed = createCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const category = await prisma.category.create({
    data: { userId, isSystem: false, ...parsed.data },
  });

  return NextResponse.json({ category }, { status: 201 });
}
