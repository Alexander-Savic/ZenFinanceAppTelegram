"use client";

import { useEffect, useState } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import { BottomSheet } from "./BottomSheet";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useUserStore } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

export function CreateBudgetSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createBudget = useBudgetStore((s) => s.createBudget);
  const { categories, fetchCategories } = useCategoryStore();
  const baseCurrency = useUserStore((s) => s.user?.baseCurrency) ?? "USD";

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [limitAmount, setLimitAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) fetchCategories();
  }, [open, fetchCategories]);

  const expenseCategories = categories.filter((c) => c.type === "EXPENSE");

  async function handleSubmit() {
    if (!name.trim() || !limitAmount || Number(limitAmount) <= 0) return;
    setIsSubmitting(true);
    const now = new Date();
    const ok = await createBudget({
      name: name.trim(),
      categoryId,
      limitAmount,
      currency: baseCurrency,
      periodStart: startOfMonth(now).toISOString(),
      periodEnd: endOfMonth(now).toISOString(),
    });
    setIsSubmitting(false);
    if (ok) {
      setName("");
      setCategoryId(undefined);
      setLimitAmount("");
      onClose();
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Новый бюджет">
      <div className="flex flex-col gap-4">
        <Field label="Название">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Продукты на месяц"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <Field label="Категория">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryId(undefined)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                categoryId === undefined ? "border-accent bg-accent-soft text-accent" : "border-border text-secondary"
              )}
            >
              Все категории
            </button>
            {expenseCategories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  categoryId === c.id ? "border-accent bg-accent-soft text-accent" : "border-border text-secondary"
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </Field>

        <Field label={`Лимит на месяц (${baseCurrency})`}>
          <input
            inputMode="decimal"
            value={limitAmount}
            onChange={(e) => setLimitAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim() || !limitAmount}
          className="mt-2 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Сохраняем…" : "Создать бюджет"}
        </button>
      </div>
    </BottomSheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-secondary">{label}</span>
      {children}
    </label>
  );
}
