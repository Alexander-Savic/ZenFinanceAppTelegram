"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAnalytics } from "@/hooks/useAnalytics";
import { PeriodTabs } from "@/components/PeriodTabs";
import { CategoryPieChart } from "@/components/CategoryPieChart";
import { CashflowAreaChart } from "@/components/CashflowAreaChart";
import type { Period } from "@/lib/date-ranges";

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [breakdownType, setBreakdownType] = useState<"EXPENSE" | "INCOME">("EXPENSE");

  const { isLoading, error, breakdown, breakdownTotal, cashflow, cashflowTotals } = useAnalytics(
    period,
    breakdownType
  );

  return (
    <div className="flex flex-col gap-5 px-4 pt-6">
      <h1 className="text-xl font-semibold text-primary">Аналитика</h1>

      <PeriodTabs value={period} onChange={setPeriod} />

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-surface p-3">
          <p className="text-xs text-secondary">Доход</p>
          <p className="mt-1 text-lg font-semibold text-success">
            +{formatMoney(cashflowTotals.income)}
          </p>
        </div>
        <div className="rounded-2xl bg-surface p-3">
          <p className="text-xs text-secondary">Расход</p>
          <p className="mt-1 text-lg font-semibold text-danger">
            −{formatMoney(cashflowTotals.expense)}
          </p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-secondary">Денежный поток</h2>
        <CashflowAreaChart data={cashflow} />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-secondary">По категориям</h2>
          <div className="flex gap-1 text-xs">
            {(["EXPENSE", "INCOME"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setBreakdownType(t)}
                className={cn(
                  "rounded-full px-3 py-1 font-medium",
                  breakdownType === t ? "bg-accent-soft text-accent" : "text-secondary"
                )}
              >
                {t === "EXPENSE" ? "Расходы" : "Доходы"}
              </button>
            ))}
          </div>
        </div>
        <CategoryPieChart data={breakdown} total={breakdownTotal} />
      </section>

      {isLoading && (
        <p className="text-center text-xs text-secondary">Обновляем данные…</p>
      )}
      {error && <p className="text-center text-xs text-danger">{error}</p>}
    </div>
  );
}
