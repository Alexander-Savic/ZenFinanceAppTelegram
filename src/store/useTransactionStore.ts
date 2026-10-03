import { create } from "zustand";
import { useAccountStore } from "./useAccountStore";

export interface TransactionDTO {
  id: string;
  type: "INCOME" | "EXPENSE" | "TRANSFER";
  amount: string;
  currency: string;
  fromAccountId: string | null;
  toAccountId: string | null;
  categoryId: string | null;
  description: string | null;
  occurredAt: string;
  tags: { tag: { id: string; name: string; colorHex: string | null } }[];
}

export type CreateTransactionInput =
  | {
      type: "INCOME" | "EXPENSE";
      accountId: string;
      categoryId?: string;
      amount: string;
      currency: string;
      description?: string;
      tagIds?: string[];
    }
  | {
      type: "TRANSFER";
      fromAccountId: string;
      toAccountId: string;
      amount: string;
      currency: string;
      exchangeRate?: string;
      description?: string;
      tagIds?: string[];
    };

interface TransactionState {
  recent: TransactionDTO[];
  transactions: TransactionDTO[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchRecent: () => Promise<void>;
  fetchTransactions: () => Promise<void>;
  createTransaction: (input: CreateTransactionInput) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteTransaction: (id: string) => Promise<boolean>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  recent: [],
  transactions: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

  fetchTransactions: async () => {
    try {
      const res = await fetch("/api/transactions");
      if (res.ok) {
        const data = await res.json();
        set({ transactions: data });
      }
    } catch (err) {
      console.error("Error fetching transactions:", err);
    }
  },

  fetchRecent: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/transactions?limit=10");
      if (!res.ok) throw new Error(`Failed to load transactions (${res.status})`);
      const { transactions } = await res.json();
      set({ recent: transactions, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        set((state) => ({
          recent: state.recent.filter((t) => t.id !== id),
          transactions: state.transactions.filter((t) => t.id !== id),
        }));

        useAccountStore.getState().fetchAccounts();
        return true;
      }
      return false;
    } catch (err) {
      console.error("Error deleting transaction:", err);
      return false;
    }
  },

  createTransaction: async (input) => {
    set({ isSubmitting: true, error: null });
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        const message =
          res.status === 422
            ? "Недостаточно средств на счёте"
            : body.error?.toString?.() ?? "Не удалось сохранить операцию";
        set({ isSubmitting: false, error: message });
        return { ok: false, error: message };
      }

      set((s) => ({
        isSubmitting: false,
        recent: [body.transaction, ...s.recent].slice(0, 10),
      }));

      useAccountStore.getState().fetchAccounts();

      return { ok: true };
    } catch (err) {
      const message = (err as Error).message;
      set({ isSubmitting: false, error: message });
      return { ok: false, error: message };
    }
  },
}));