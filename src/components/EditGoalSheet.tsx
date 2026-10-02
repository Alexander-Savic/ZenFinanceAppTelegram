"use client";

import { useState, useEffect } from "react";
import { BottomSheet } from "./BottomSheet";
import { useGoalStore, type GoalDTO } from "@/store/useGoalStore";
import { Trash2 } from "lucide-react";

export function EditGoalSheet({
  goal,
  open,
  onClose,
}: {
  goal: GoalDTO | null;
  open: boolean;
  onClose: () => void;
}) {
  const updateGoal = useGoalStore((s) => s.updateGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (goal) {
      setName(goal.name);
      setTargetAmount(goal.targetAmount);
    }
  }, [goal]);

  if (!goal) return null;

  async function handleSave() {
    if (!name.trim() || Number(targetAmount) <= 0) return;
    setIsSubmitting(true);
    const ok = await updateGoal(goal!.id, { name: name.trim(), targetAmount });
    setIsSubmitting(false);
    if (ok) onClose();
  }

  async function handleDelete() {
    if (confirm(`Вы уверены, что хотите удалить копилку "${goal!.name}"?`)) {
      setIsSubmitting(true);
      const ok = await deleteGoal(goal!.id);
      setIsSubmitting(false);
      if (ok) onClose();
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Редактировать цель">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-secondary">Название</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-secondary">Целевая сумма ({goal.currency})</span>
          <input
            inputMode="decimal"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </label>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleDelete}
            disabled={isSubmitting}
            className="flex items-center justify-center rounded-xl bg-danger/10 p-3 text-danger hover:bg-danger/20 transition-colors"
            title="Удалить копилку"
          >
            <Trash2 className="h-5 w-5" />
          </button>

          <button
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
            className="flex-1 rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50"
          >
            {isSubmitting ? "Сохраняем…" : "Сохранить"}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}