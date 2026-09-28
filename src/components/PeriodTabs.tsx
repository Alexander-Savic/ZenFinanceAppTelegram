"use client";

import { cn } from "@/lib/utils";
import type { Period } from "@/lib/date-ranges";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" },
  { value: "year", label: "Год" },
];

export function PeriodTabs({
  value,
  onChange,
}: {
  value: Period;
  onChange: (period: Period) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl bg-surface p-1">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
            value === opt.value ? "bg-accent text-accent-foreground" : "text-secondary"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
