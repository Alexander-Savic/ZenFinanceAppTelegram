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
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  fetchRecent: () => Promise<void>;
  createTransaction: (input: CreateTransactionInput) => Promise<{ ok: true } | { ok: false; error: string }>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  recent: [],
  isLoading: false,
  isSubmitting: false,
  error: null,

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

      // Balances changed server-side; re-fetch rather than reconcile Decimal
      // math on the client (see the Phase-0 note on why balance math stays
      // server-authoritative).
      useAccountStore.getState().fetchAccounts();

      return { ok: true };
    } catch (err) {
      const message = (err as Error).message;
      set({ isSubmitting: false, error: message });
      return { ok: false, error: message };
    }
  },
}));
