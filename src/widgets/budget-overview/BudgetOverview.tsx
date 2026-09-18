'use client';

import { AlertTriangle, CheckCircle2, PieChart } from 'lucide-react';
import type { Category, Transaction } from '@/shared/types/finance';

interface BudgetOverviewProps {
  categories: Category[];
  transactions: Transaction[];
}

export function BudgetOverview({ categories, transactions }: BudgetOverviewProps) {
  // Фильтруем категории расходов, у которых задан бюджетный лимит
  const budgetedCategories = categories.filter((c) => c.type === 'expense' && c.budgetLimit && c.budgetLimit > 0);

  if (budgetedCategories.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-5 border border-slate-100 shadow-sm text-center">
        <PieChart className="mx-auto h-8 w-8 text-slate-300" />
        <p className="mt-2 text-xs font-semibold text-slate-500">Лимиты бюджетов не установлены</p>
        <p className="mt-1 text-[11px] text-slate-400">Установите лимиты в управлении категориями для контроля трат</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-emerald-600" /> Бюджеты по категориям
        </h3>
        <span className="text-xs text-slate-400 font-medium">Текущий месяц</span>
      </div>

      <div className="flex flex-col gap-3.5 mt-1">
        {budgetedCategories.map((cat) => {
          // Считаем сумму трат по данной категории
          const spent = transactions
            .filter((t) => t.categoryId === cat.id && t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

          const limit = cat.budgetLimit || 1;
          const percent = Math.min(Math.round((spent / limit) * 100), 100);
          const isOverbudget = spent > limit;

          return (
            <div key={cat.id} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-base">{cat.icon}</span>
                  <span className="font-semibold text-slate-700">{cat.name}</span>
                </div>
                <div className="flex items-center gap-1.5 font-bold tabular-nums">
                  <span className={isOverbudget ? 'text-rose-600' : 'text-emerald-600'}>
                    ${spent.toLocaleString('ru-RU')}
                  </span>
                  <span className="text-slate-400 font-normal">/ ${limit.toLocaleString()}</span>
                  {isOverbudget ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-500 ml-1" />
                  ) : percent >= 80 ? (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 ml-1" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 ml-1" />
                  )}
                </div>
              </div>

              {/* Прогресс-бар с меняющимся цветом при превышении */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isOverbudget
                      ? 'bg-rose-500'
                      : percent >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}