import { create } from "zustand";

export interface GoalDTO {
  id: string;
  name: string;
  targetAmount: string;
  currentAmount: string;
  currency: string;
  targetDate: string | null;
  status: "IN_PROGRESS" | "COMPLETED" | "ARCHIVED";
  iconKey: string | null;
  roundUpEnabled: boolean;
}

export interface CreateGoalInput {
  name: string;
  targetAmount: string;
  currency: string;
  targetDate?: string;
  iconKey?: string;
}

interface GoalState {
  goals: GoalDTO[];
  isLoading: boolean;
  error: string | null;
  fetchGoals: () => Promise<void>;
  createGoal: (input: CreateGoalInput) => Promise<boolean>;
  addDeposit: (goalId: string, amount: string, note?: string) => Promise<boolean>;
}

export const useGoalStore = create<GoalState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error(`Failed to load goals (${res.status})`);
      const { goals } = await res.json();
      set({ goals, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createGoal: async (input) => {
    try {
      const res = await fetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Не удалось создать цель");
      const { goal } = await res.json();
      set({ goals: [...get().goals, goal] });
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  addDeposit: async (goalId, amount, note) => {
    try {
      const res = await fetch(`/api/goals/${goalId}/deposits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, note }),
      });
      if (!res.ok) throw new Error("Не удалось пополнить цель");
      const { goal } = await res.json();
      set({ goals: get().goals.map((g) => (g.id === goal.id ? goal : g)) });
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },
}));
