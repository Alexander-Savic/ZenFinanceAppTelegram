"use client";

import { useEffect, useState, useCallback } from "react";

interface RatesResponse {
  base: string;
  rates: Record<string, number>;
  isLive: boolean;
}

export function useExchangeRates() {
  const [data, setData] = useState<RatesResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/rates")
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .finally(() => setIsLoading(false));
  }, []);

  const getRate = useCallback(
    (from: string, to: string): number | null => {
      if (!data) return null;
      if (from === to) return 1;
      const fromRate = data.rates[from];
      const toRate = data.rates[to];
      if (!fromRate || !toRate) return null;
      return toRate / fromRate;
    },
    [data]
  );

  return { isLoading, isLive: data?.isLive ?? false, getRate };
}
