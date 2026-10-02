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

interface AccountState {
  accounts: AccountDTO[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  deleteAccount: (id: string) => Promise<boolean>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/accounts", { credentials: "include" });
      if (!res.ok) throw new Error("Не удалось загрузить счета");
      const { accounts } = await res.json();
      set({ accounts, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
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