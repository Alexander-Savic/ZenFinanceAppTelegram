import { cookies } from "next/headers";
import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export async function requireUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("zf_session")?.value;

  if (token) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const session = await prisma.session.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
      },
      select: { userId: true },
    });

    if (session) {
      return session.userId;
    }
  }

  if (process.env.NODE_ENV === "development") {
    const devUser = await prisma.user.findFirst({
      where: { telegramId: 123456789 },
      select: { id: true },
    });

    if (devUser) {
      return devUser.id;
    }
  }

  throw new UnauthorizedError("Session missing or expired");
}