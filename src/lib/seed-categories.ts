import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const DEFAULT_EXPENSE_CATEGORIES: Array<{ name: string; iconKey: string; colorHex: string }> = [
  { name: "Еда и рестораны", iconKey: "utensils", colorHex: "#f59e0b" },
  { name: "Продукты", iconKey: "shopping-cart", colorHex: "#22c55e" },
  { name: "Транспорт", iconKey: "car", colorHex: "#6366f1" },
  { name: "Жильё и счета", iconKey: "home", colorHex: "#8b5cf6" },
  { name: "Здоровье", iconKey: "heart-pulse", colorHex: "#f43f5e" },
  { name: "Развлечения", iconKey: "party-popper", colorHex: "#06b6d4" },
  { name: "Покупки", iconKey: "shopping-bag", colorHex: "#ec4899" },
  { name: "Путешествия", iconKey: "plane", colorHex: "#0ea5e9" },
  { name: "Подписки", iconKey: "repeat", colorHex: "#a855f7" },
  { name: "Прочее", iconKey: "more-horizontal", colorHex: "#6b7280" },
];

const DEFAULT_INCOME_CATEGORIES: Array<{ name: string; iconKey: string; colorHex: string }> = [
  { name: "Зарплата", iconKey: "wallet", colorHex: "#22c55e" },
  { name: "Фриланс", iconKey: "laptop", colorHex: "#6366f1" },
  { name: "Подарки", iconKey: "gift", colorHex: "#f43f5e" },
  { name: "Инвестиции", iconKey: "trending-up", colorHex: "#8b5cf6" },
  { name: "Прочее", iconKey: "more-horizontal", colorHex: "#6b7280" },
];

export async function seedDefaultCategories(
  tx: Prisma.TransactionClient | typeof prisma,
  userId: string
) {
  await tx.category.createMany({
    data: [
      ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
        userId,
        type: "EXPENSE" as const,
        isSystem: true,
        ...c,
      })),
      ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
        userId,
        type: "INCOME" as const,
        isSystem: true,
        ...c,
      })),
    ],
  });
}
