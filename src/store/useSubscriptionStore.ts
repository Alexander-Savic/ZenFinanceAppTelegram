import { create } from "zustand";
import type { Interval } from "@/lib/recurrence";

export interface SubscriptionDTO {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  currency: string;
  accountId: string;
  account: { name: string };
  interval: Interval;
  nextRunAt: string;
  status: "ACTIVE" | "PAUSED" | "CANCELLED";
}

export interface CreateSubscriptionInput {
  name: string;
  type: "INCOME" | "EXPENSE";
  amount: string;
  accountId: string;
  interval: Interval;
  nextRunAt: string;
}

interface SubscriptionState {
  subscriptions: SubscriptionDTO[];
  isLoading: boolean;
  error: string | null;
  fetchSubscriptions: () => Promise<void>;
  createSubscription: (input: CreateSubscriptionInput) => Promise<boolean>;
  toggleStatus: (id: string) => Promise<void>;
  deleteSubscription: (id: string) => Promise<void>;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscriptions: [],
  isLoading: false,
  error: null,

  fetchSubscriptions: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/subscriptions");
      if (!res.ok) throw new Error(`Failed to load subscriptions (${res.status})`);
      const { subscriptions } = await res.json();
      set({ subscriptions, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createSubscription: async (input) => {
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Не удалось создать подписку");
      const { subscription } = await res.json();
      set({ subscriptions: [...get().subscriptions, subscription] });
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  toggleStatus: async (id) => {
    const previous = get().subscriptions;
    const target = previous.find((s) => s.id === id);
    if (!target) return;
    const next = target.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    set({ subscriptions: previous.map((s) => (s.id === id ? { ...s, status: next } : s)) });
    const res = await fetch(`/api/subscriptions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) set({ subscriptions: previous });
  },

  deleteSubscription: async (id) => {
    const previous = get().subscriptions;
    set({ subscriptions: previous.filter((s) => s.id !== id) });
    const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    if (!res.ok) set({ subscriptions: previous });
  },
}));