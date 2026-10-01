"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBudgetStore } from "@/store/useBudgetStore";
import { useGoalStore } from "@/store/useGoalStore";
import { BudgetCard } from "@/components/BudgetCard";
import { GoalCard } from "@/components/GoalCard";
import { CreateBudgetSheet } from "@/components/CreateBudgetSheet";
import { CreateGoalSheet } from "@/components/CreateGoalSheet";

type Tab = "budgets" | "goals";

export default function BudgetsPage() {
  const [tab, setTab] = useState<Tab>("budgets");
  const [sheetOpen, setSheetOpen] = useState(false);

  const { budgets, isLoading: budgetsLoading, fetchBudgets, deleteBudget } = useBudgetStore();
  const { goals, isLoading: goalsLoading, fetchGoals } = useGoalStore();

  useEffect(() => {
    fetchBudgets();
    fetchGoals();
  }, [fetchBudgets, fetchGoals]);

  const isLoading = tab === "budgets" ? budgetsLoading : goalsLoading;
  const isEmpty = tab === "budgets" ? budgets.length === 0 : goals.length === 0;

  return (
    <div className="flex flex-col gap-5 px-4 pt-6 pb-28">
      <h1 className="text-xl font-semibold text-primary">Бюджеты и цели</h1>

      <div className="flex gap-1 rounded-xl bg-surface p-1">
        <TabButton active={tab === "budgets"} onClick={() => setTab("budgets")}>
          Бюджеты
        </TabButton>
        <TabButton active={tab === "goals"} onClick={() => setTab("goals")}>
          Копилка
        </TabButton>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      )}

      {!isLoading && isEmpty && (
        <div className="rounded-2xl bg-surface p-6 text-center text-sm text-secondary">
          {tab === "budgets"
            ? "Пока нет бюджетов — создайте первый, чтобы отслеживать лимиты по категориям"
            : "Пока нет целей — начните копить на что-то важное"}
        </div>
      )}

      {!isLoading && tab === "budgets" && (
        <div className="flex flex-col gap-3">
          {budgets.map((b) => (
            <BudgetCard key={b.id} budget={b} onDelete={deleteBudget} />
          ))}
        </div>
      )}

      {!isLoading && tab === "goals" && (
        <div className="flex flex-col gap-3">
          {goals.map((g) => (
            <GoalCard key={g.id} goal={g} />
          ))}
        </div>
      )}

      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl"
        aria-label={tab === "budgets" ? "Новый бюджет" : "Новая цель"}
      >
        <Plus className="h-6 w-6" />
      </button>

      <CreateBudgetSheet open={sheetOpen && tab === "budgets"} onClose={() => setSheetOpen(false)} />
      <CreateGoalSheet open={sheetOpen && tab === "goals"} onClose={() => setSheetOpen(false)} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-secondary"
      )}
    >
      {children}
    </button>
  );
}