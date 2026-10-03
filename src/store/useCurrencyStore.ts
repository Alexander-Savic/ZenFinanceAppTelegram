import { create } from "zustand";

interface CurrencyState {
  rates: Record<string, number>;
  baseCurrency: string;
  isLoading: boolean;
  fetchRates: () => Promise<void>;
  setBaseCurrency: (currency: string) => void;
  convert: (amount: number | string, fromCurrency: string, toCurrency?: string) => number;
}

export const useCurrencyStore = create<CurrencyState>((set, get) => ({
  rates: { BYN: 1, USD: 3.25, EUR: 3.55, RUB: 0.035, BTC: 210000 },
  baseCurrency: "BYN",
  isLoading: false,

  setBaseCurrency: (currency: string) => set({ baseCurrency: currency }),

  fetchRates: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/currencies/rates");
      if (res.ok) {
        const data = await res.json();
        set({ rates: data.rates, isLoading: false });
      }
    } catch (err) {
      console.error("Failed to load rates:", err);
      set({ isLoading: false });
    }
  },

  convert: (amount: number | string, fromCurrency: string, toCurrency?: string) => {
    const num = Number(amount);
    if (isNaN(num) || num === 0) return 0;

    const from = fromCurrency.toUpperCase();
    const to = (toCurrency || get().baseCurrency).toUpperCase();
    const rates = get().rates;

    if (from === to) return num;

    const fromRateInByn = rates[from];
    const toRateInByn = rates[to];

    if (!fromRateInByn || !toRateInByn) return num;

    const amountInByn = num * fromRateInByn;
    return amountInByn / toRateInByn;
  },
}));