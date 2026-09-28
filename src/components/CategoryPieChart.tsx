"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { CategoryBreakdownItem } from "@/hooks/useAnalytics";

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

export function CategoryPieChart({
  data,
  total,
}: {
  data: CategoryBreakdownItem[];
  total: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl bg-surface text-sm text-secondary">
        Нет данных за этот период
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-surface p-4">
      <div className="relative mx-auto h-52 w-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="amount"
              nameKey="name"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {data.map((item) => (
                <Cell key={item.categoryId ?? item.name} fill={item.colorHex} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${formatMoney(value)}`, name]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid var(--zf-border)",
                background: "var(--zf-surface)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-secondary">Всего</span>
          <span className="text-lg font-semibold text-primary">{formatMoney(total)}</span>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {data.map((item) => (
          <li key={item.categoryId ?? item.name} className="flex items-center gap-3 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.colorHex }}
            />
            <span className="flex-1 truncate text-primary">{item.name}</span>
            <span className="text-secondary">{item.percent}%</span>
            <span className="w-20 text-right font-medium text-primary">
              {formatMoney(item.amount)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
