"use client";

import { useState } from "react";
import { PiggyBank, Check, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGoalStore, type GoalDTO } from "@/store/useGoalStore";

function formatMoney(n: number, currency: string) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n)} ${currency}`;
}

export function GoalCard({ goal }: { goal: GoalDTO }) {
  const addDeposit = useGoalStore((s) => s.addDeposit);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);

  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const current = Number(goal.currentAmount);
  const target = Number(goal.targetAmount);
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const isCompleted = goal.status === "COMPLETED";

  async function handleDeposit() {
    if (!amount || Number(amount) <= 0) return;
    setIsSubmitting(true);
    const ok = await addDeposit(goal.id, amount);
    setIsSubmitting(false);
    if (ok) {
      setAmount("");
      setDepositOpen(false);
    }
  }

  async function handleDelete() {
    if (confirm(`Удалить копилку "${goal.name}"?`)) {
      await deleteGoal(goal.id);
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-4 border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent">
            <PiggyBank className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-primary">{goal.name}</p>
            {goal.targetDate && (
              <p className="text-xs text-secondary">
                до {new Date(goal.targetDate).toLocaleDateString("ru-RU")}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isCompleted && (
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              <Check className="h-3 w-3" /> Достигнуто
            </span>
          )}

          {/* Кнопка удаления копилки */}
          <button
            onClick={handleDelete}
            className="rounded-lg p-1.5 text-secondary hover:bg-danger/10 hover:text-danger transition-colors"
            title="Удалить копилку"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className={cn("h-full rounded-full transition-all", isCompleted ? "bg-success" : "bg-accent")}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-secondary">
          {formatMoney(current, goal.currency)} из {formatMoney(target, goal.currency)}
        </span>
        <span className="text-secondary">{percent}%</span>
      </div>

      {!isCompleted && (
        <div className="mt-3">
          {depositOpen ? (
            <div className="flex gap-2">
              <input
                autoFocus
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="Сумма"
                className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-primary"
              />
              <button
                onClick={handleDeposit}
                disabled={isSubmitting}
                className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground disabled:opacity-50"
              >
                {isSubmitting ? "…" : "Ок"}
              </button>
              <button
                onClick={() => setDepositOpen(false)}
                className="rounded-lg px-2 text-sm text-secondary"
              >
                ×
              </button>
            </div>
          ) : (
            <button
              onClick={() => setDepositOpen(true)}
              className="w-full rounded-lg border border-dashed border-border py-1.5 text-sm font-medium text-accent"
            >
              + Пополнить
            </button>
          )}
        </div>
      )}
    </div>
  );
}