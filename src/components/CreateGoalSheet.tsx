"use client";

import { useState } from "react";
import { BottomSheet } from "./BottomSheet";
import { useGoalStore } from "@/store/useGoalStore";
import { useUserStore } from "@/store/useUserStore";

export function CreateGoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createGoal = useGoalStore((s) => s.createGoal);
  const baseCurrency = useUserStore((s) => s.user?.baseCurrency) ?? "USD";

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!name.trim() || !targetAmount || Number(targetAmount) <= 0) return;
    setIsSubmitting(true);
    const ok = await createGoal({
      name: name.trim(),
      targetAmount,
      currency: baseCurrency,
      targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
    });
    setIsSubmitting(false);
    if (ok) {
      setName("");
      setTargetAmount("");
      setTargetDate("");
      onClose();
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Новая цель">
      <div className="flex flex-col gap-4">
        <Field label="Название">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Новый ноутбук"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <Field label={`Целевая сумма (${baseCurrency})`}>
          <input
            inputMode="decimal"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <Field label="Дата (необязательно)">
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <p className="text-xs text-secondary">
          Округление покупок в копилку можно включить позже, в настройках цели.
        </p>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim() || !targetAmount}
          className="mt-1 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Сохраняем…" : "Создать цель"}
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
