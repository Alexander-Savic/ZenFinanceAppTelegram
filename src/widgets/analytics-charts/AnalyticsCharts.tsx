'use client';

import { useMemo, useState, type FC } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { Category, Transaction } from '@/shared/types/finance';

type Period = 'week' | 'month' | 'year';

interface TrendPoint {
  label: string;
  income: number;
  expense: number;
}

interface CategorySlice {
  categoryId: string;
  name: string;
  color: string;
  value: number;
  percent: number;
}

const PERIOD_LABEL: Record<Period, string> = { week: 'Неделя', month: 'Месяц', year: 'Год' };
const INCOME_COLOR = '#059669';
const EXPENSE_COLOR = '#27272A';


function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildTrend(transactions: Transaction[], period: Period): TrendPoint[] {
  const now = startOfDay(new Date());

  if (period === 'week') {
    const points: Array<TrendPoint & { key: string }> = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      return {
        label: new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(date),
        income: 0,
        expense: 0,
        key: date.toISOString().slice(0, 10),
      };
    });
    for (const t of transactions) {
      const point = points.find((p) => p.key === t.date.slice(0, 10));
      if (!point) continue;
      if (t.type === 'income') point.income += t.amount;
      if (t.type === 'expense') point.expense += t.amount;
    }
    return points.map(({ label, income, expense }) => ({ label, income, expense }));
  }

  if (period === 'month') {
    const points: Array<TrendPoint & { start: Date; end: Date }> = Array.from({ length: 4 }, (_, i) => {
      const end = new Date(now);
      end.setDate(end.getDate() - (3 - i) * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 6);
      const label = `${start.getDate()}–${end.getDate()} ${new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(end)}`;
      return { label, income: 0, expense: 0, start, end };
    });
    for (const t of transactions) {
      const date = new Date(t.date);
      const point = points.find((p) => date >= p.start && date <= p.end);
      if (!point) continue;
      if (t.type === 'income') point.income += t.amount;
      if (t.type === 'expense') point.expense += t.amount;
    }
    return points.map(({ label, income, expense }) => ({ label, income, expense }));
  }

  const points: Array<TrendPoint & { month: number; year: number }> = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    return {
      label: new Intl.DateTimeFormat('ru-RU', { month: 'short' }).format(date),
      income: 0,
      expense: 0,
      month: date.getMonth(),
      year: date.getFullYear(),
    };
  });
  for (const t of transactions) {
    const date = new Date(t.date);
    const point = points.find((p) => p.month === date.getMonth() && p.year === date.getFullYear());
    if (!point) continue;
    if (t.type === 'income') point.income += t.amount;
    if (t.type === 'expense') point.expense += t.amount;
  }
  return points.map(({ label, income, expense }) => ({ label, income, expense }));
}

function buildCategorySlices(transactions: Transaction[], categories: Record<string, Category>): CategorySlice[] {
  const totals = new Map<string, number>();
  let total = 0;

  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    totals.set(t.categoryId, (totals.get(t.categoryId) ?? 0) + t.amount);
    total += t.amount;
  }

  return Array.from(totals.entries())
    .map(([categoryId, value]) => ({
      categoryId,
      name: categories[categoryId]?.name ?? 'Без категории',
      color: categories[categoryId]?.color ?? '#9CA3AF',
      value,
      percent: total > 0 ? (value / total) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
}

const ChartTooltip: FC<ChartTooltipProps> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-[#12131A] px-3 py-2 text-xs text-white shadow-lg">
      {label && <p className="mb-1 font-medium text-white/70">{label}</p>}
      {payload.map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-1.5 tabular-nums">
          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value.toLocaleString('ru-RU')} $
        </p>
      ))}
    </div>
  );
};

export interface AnalyticsChartsProps {
  transactions: Transaction[];
  categories: Record<string, Category>;
}

export const AnalyticsCharts: FC<AnalyticsChartsProps> = ({ transactions, categories }) => {
  const [period, setPeriod] = useState<Period>('month');

  const trend = useMemo(() => buildTrend(transactions, period), [transactions, period]);
  const slices = useMemo(() => buildCategorySlices(transactions, categories), [transactions, categories]);
  const totalExpense = slices.reduce((sum, s) => sum + s.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 self-start rounded-full bg-black/[0.05] p-1">
        {(Object.keys(PERIOD_LABEL) as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition-colors"
            style={period === p ? { backgroundColor: 'var(--primary)', color: '#fff' } : { color: 'rgba(0,0,0,0.5)' }}
          >
            {PERIOD_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-4">
        <div className="mb-3 flex items-center gap-4 text-xs font-medium text-black/50">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: INCOME_COLOR }} />
            Доходы
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: EXPENSE_COLOR }} />
            Расходы
          </span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={trend} barGap={4} margin={{ left: -20 }}>
            <CartesianGrid vertical={false} stroke="rgba(0,0,0,0.06)" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.4)' }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'rgba(0,0,0,0.4)' }} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="income" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} maxBarSize={18} />
            <Bar dataKey="expense" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-2xl bg-white p-4">
        <p className="mb-3 text-xs font-medium text-black/50">Расходы по категориям</p>
        {slices.length === 0 ? (
          <p className="py-8 text-center text-xs text-black/35">Нет расходов за выбранный период</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative h-40 w-40 flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {slices.map((slice) => (
                      <Cell key={slice.categoryId} fill={slice.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold tabular-nums text-black/85">
                  {totalExpense.toLocaleString('ru-RU')}
                </span>
                <span className="text-[10px] text-black/40">$ расходов</span>
              </div>
            </div>

            <ul className="flex min-w-0 flex-1 flex-col gap-2">
              {slices.slice(0, 5).map((slice) => (
                <li key={slice.categoryId} className="flex items-center gap-2 text-xs">
                  <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
                  <span className="min-w-0 flex-1 truncate text-black/70">{slice.name}</span>
                  <span className="flex-shrink-0 tabular-nums text-black/40">{slice.percent.toFixed(0)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
