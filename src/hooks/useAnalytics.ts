"use client";

import { useEffect, useState, useCallback } from "react";
import type { Period } from "@/lib/date-ranges";

export interface CategoryBreakdownItem {
  categoryId: string | null;
  name: string;
  colorHex: string;
  iconKey: string;
  amount: number;
  percent: number;
}

export interface CashflowPoint {
  label: string;
  income: number;
  expense: number;
  net: number;
}

interface AnalyticsState {
  isLoading: boolean;
  error: string | null;
  breakdown: CategoryBreakdownItem[];
  breakdownTotal: number;
  cashflow: CashflowPoint[];
  cashflowTotals: { income: number; expense: number };
}

export function useAnalytics(period: Period, breakdownType: "EXPENSE" | "INCOME") {
  const [state, setState] = useState<AnalyticsState>({
    isLoading: true,
    error: null,
    breakdown: [],
    breakdownTotal: 0,
    cashflow: [],
    cashflowTotals: { income: 0, expense: 0 },
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const [breakdownRes, cashflowRes] = await Promise.all([
        fetch(`/api/analytics/category-breakdown?period=${period}&type=${breakdownType}`),
        fetch(`/api/analytics/cashflow?period=${period}`),
      ]);
      if (!breakdownRes.ok || !cashflowRes.ok) {
        throw new Error("Не удалось загрузить аналитику");
      }
      const breakdownJson = await breakdownRes.json();
      const cashflowJson = await cashflowRes.json();
      setState({
        isLoading: false,
        error: null,
        breakdown: breakdownJson.breakdown,
        breakdownTotal: breakdownJson.total,
        cashflow: cashflowJson.series,
        cashflowTotals: cashflowJson.totals,
      });
    } catch (err) {
      setState((s) => ({ ...s, isLoading: false, error: (err as Error).message }));
    }
  }, [period, breakdownType]);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, refetch: load };
}
