import { create } from "zustand";

export interface AccountDTO {
  id: string;
  name: string;
  type: "CASH" | "CARD" | "CRYPTO" | "SAVINGS" | "INVESTMENT";
  currency: string;
  balance: string; // Decimal serialized as string — never coerce to number for math
  colorGradientStart?: string | null;
  colorGradientEnd?: string | null;
  iconKey?: string | null;
  monthlyLimit?: string | null;
}

export interface CreateAccountInput {
  name: string;
  type: AccountDTO["type"];
  currency: string;
  initialBalance?: string;
  colorGradientStart?: string;
  colorGradientEnd?: string;
  iconKey?: string;
  maskedNumber?: string;
  monthlyLimit?: string;
}

interface AccountState {
  accounts: AccountDTO[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  createAccount: (input: CreateAccountInput) => Promise<boolean>;
  upsertAccount: (account: AccountDTO) => void;
  removeAccount: (id: string) => void;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/accounts");
      if (!res.ok) throw new Error(`Failed to load accounts (${res.status})`);
      const { accounts } = await res.json();
      set({ accounts, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createAccount: async (input) => {
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error("Не удалось создать счёт");
      const { account } = await res.json();
      set({ accounts: [...get().accounts, account] });
      return true;
    } catch (err) {
      set({ error: (err as Error).message });
      return false;
    }
  },

  upsertAccount: (account) => {
    const existing = get().accounts;
    const idx = existing.findIndex((a) => a.id === account.id);
    if (idx === -1) {
      set({ accounts: [...existing, account] });
    } else {
      const next = [...existing];
      next[idx] = account;
      set({ accounts: next });
    }
  },

  removeAccount: (id) => {
    set({ accounts: get().accounts.filter((a) => a.id !== id) });
  },
}));