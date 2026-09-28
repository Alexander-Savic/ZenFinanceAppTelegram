import { create } from 'zustand';

export interface Contact {
  id: string;
  name: string;
  telegramUsername?: string;
  phone?: string;
}

export interface Debt {
  id: string;
  direction: 'I_OWE' | 'OWED_TO_ME';
  principal: number;
  remaining: number;
  currency: string;
  status: 'ACTIVE' | 'OVERDUE' | 'SETTLED';
  dueDate?: string;
  note?: string;
  contact?: Contact;
}

interface AddDebtPayload {
  contactName: string;
  direction: 'I_OWE' | 'OWED_TO_ME';
  principal: number;
  currency?: string;
  dueDate?: string;
  note?: string;
}

interface DebtState {
  debts: Debt[];
  isLoading: boolean;
  fetchDebts: () => Promise<void>;
  addDebt: (debtData: AddDebtPayload) => Promise<void>;
  updateDebtStatus: (id: string, status: 'ACTIVE' | 'OVERDUE' | 'SETTLED') => Promise<void>;
  deleteDebt: (id: string) => Promise<void>;
}

export const useDebtStore = create<DebtState>((set) => ({
  debts: [],
  isLoading: false,

  fetchDebts: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch('/api/debts');
      if (res.ok) {
        const data = await res.json();
        set({ debts: data });
      }
    } catch (error) {
      console.error('Failed to fetch debts:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addDebt: async (debtData) => {
    try {
      const res = await fetch('/api/debts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debtData),
      });
      if (res.ok) {
        const newDebt = await res.json();
        set((state) => ({ debts: [newDebt, ...state.debts] }));
      }
    } catch (error) {
      console.error('Failed to add debt:', error);
    }
  },

  updateDebtStatus: async (id, status) => {
    try {
      const res = await fetch(`/api/debts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          ...(status === 'SETTLED' ? { remaining: 0 } : {}),
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        set((state) => ({
          debts: state.debts.map((d) => (d.id === id ? updated : d)),
        }));
      }
    } catch (error) {
      console.error('Failed to update debt status:', error);
    }
  },

  deleteDebt: async (id) => {
    try {
      const res = await fetch(`/api/debts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        set((state) => ({
          debts: state.debts.filter((d) => d.id !== id),
        }));
      }
    } catch (error) {
      console.error('Failed to delete debt:', error);
    }
  },
}));