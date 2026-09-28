"use client";

import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BudgetDTO } from "@/store/useBudgetStore";

function formatMoney(n: number, currency: string) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n)} ${currency}`;
}

export function BudgetCard({ budget, onDelete }: { budget: BudgetDTO; onDelete: (id: string) => void }) {
  const isOver = budget.percentUsed >= 100;
  const isNear = budget.percentUsed >= 80 && !isOver;

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {budget.category && (
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: budget.category.colorHex }}
            />
          )}
          <div>
            <p className="text-sm font-medium text-primary">{budget.name}</p>
            <p className="text-xs text-secondary">
              {budget.category?.name ?? "Все категории"}
            </p>
          </div>
        </div>
        <button
          onClick={() => onDelete(budget.id)}
          className="rounded-full p-1.5 text-secondary hover:bg-bg"
          aria-label="Удалить бюджет"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            isOver ? "bg-danger" : isNear ? "bg-warning" : "bg-accent"
          )}
          style={{ width: `${Math.min(100, budget.percentUsed)}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className={cn(isOver ? "font-medium text-danger" : "text-secondary")}>
          {formatMoney(budget.spent, budget.currency)} из {formatMoney(Number(budget.limitAmount), budget.currency)}
        </span>
        <span className="text-secondary">{budget.percentUsed}%</span>
      </div>
    </div>
  );
}
