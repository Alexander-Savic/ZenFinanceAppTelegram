"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { CashflowPoint } from "@/hooks/useAnalytics";

function formatMoney(n: number) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);
}

export function CashflowAreaChart({ data }: { data: CashflowPoint[] }) {
  const hasData = data.some((p) => p.income > 0 || p.expense > 0);

  if (!hasData) {
    return (
      <div className="flex h-56 items-center justify-center rounded-2xl bg-surface text-sm text-secondary">
        Нет операций за этот период
      </div>
    );
  }

  return (
    <div className="h-56 rounded-2xl bg-surface p-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--zf-success)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--zf-success)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--zf-danger)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--zf-danger)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--zf-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "var(--zf-text-secondary)" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: "var(--zf-text-secondary)" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            formatter={(value: number, name: string) => [
              formatMoney(value),
              name === "income" ? "Доход" : "Расход",
            ]}
            contentStyle={{
              borderRadius: 12,
              border: "1px solid var(--zf-border)",
              background: "var(--zf-surface)",
            }}
          />
          <Area
            type="monotone"
            dataKey="income"
            stroke="var(--zf-success)"
            fill="url(#incomeFill)"
            strokeWidth={2}
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="var(--zf-danger)"
            fill="url(#expenseFill)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
