import { create } from "zustand";

export interface AccountDTO {
  id: string;
  name: string;
  type: "CASH" | "CARD" | "CRYPTO" | "SAVINGS" | "INVESTMENT";
  balance: string;
  currency: string;
  monthlyLimit?: string | null;
  colorGradientStart?: string | null;
  colorGradientEnd?: string | null;
}

export interface CreateAccountInput {
  name: string;
  type: AccountDTO["type"];
  balance?: string;
  initialBalance?: string;
  currency: string;
  monthlyLimit?: string;
  colorGradientStart?: string;
  colorGradientEnd?: string;
}

interface AccountState {
  accounts: AccountDTO[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (data: CreateAccountInput) => Promise<boolean>;
  deleteAccount: (id: string) => Promise<boolean>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/accounts", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const accountsList = Array.isArray(data) ? data : data.accounts || [];
        set({ accounts: accountsList, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error("Fetch accounts error:", err);
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createAccount: async (data: CreateAccountInput) => {
    try {
      const payload = {
        ...data,
        balance: data.initialBalance ?? data.balance ?? "0",
      };

      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Не удалось создать счёт");

      const newAccount = await res.json();

      set({ accounts: [...get().accounts, newAccount] });

      get().fetchAccounts();

      return true;
    } catch (err) {
      console.error("Create account error:", err);
      return false;
    }
  },

  deleteAccount: async (id: string) => {
    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Не удалось удалить счёт");

      set({ accounts: get().accounts.filter((a) => a.id !== id) });
      return true;
    } catch (err) {
      console.error("Delete account error:", err);
      return false;
    }
  },
}));