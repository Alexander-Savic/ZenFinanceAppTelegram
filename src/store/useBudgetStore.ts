import { create } from "zustand";

export interface BudgetDTO {
  id: string;
  name: string;
  categoryId: string | null;
  category: { id: string; name: string; iconKey: string; colorHex: string } | null;
  limitAmount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  spent: number;
  percentUsed: number;
}

export interface CreateBudgetInput {
  name: string;
  categoryId?: string;
  limitAmount: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
}

interface BudgetState {
  budgets: BudgetDTO[];
  isLoading: boolean;
  error: string | null;
  fetchBudgets: () => Promise<void>;
  createBudget: (input: CreateBudgetInput) => Promise<boolean>;
  deleteBudget: (id: string) => Promise<void>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  budgets: [],
  isLoading: false,
  error: null,

  fetchBudgets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/budgets", { credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load budgets (${res.status})`);
      const { budgets } = await res.json();
      set({ budgets, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },
  createBudget: async (input) => {
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Не удалось создать бюджет");
      const { budget } = await res.json();
      set({ budgets: [...get().budgets, budget] });
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  deleteBudget: async (id) => {
    const previous = get().budgets;
    set({ budgets: previous.filter((b) => b.id !== id) }); // optimistic
    const res = await fetch(`/api/budgets/${id}`, { method: "DELETE" });
    if (!res.ok) set({ budgets: previous }); // revert on failure
  },
}));
