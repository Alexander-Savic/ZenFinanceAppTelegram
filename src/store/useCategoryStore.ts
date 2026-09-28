import { create } from "zustand";

export interface CategoryDTO {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  iconKey: string;
  colorHex: string;
  parentId: string | null;
  isSystem: boolean;
}

interface CategoryState {
  categories: CategoryDTO[];
  isLoading: boolean;
  error: string | null;
  hasFetched: boolean;
  fetchCategories: () => Promise<void>;
  createCategory: (input: {
    name: string;
    type: "INCOME" | "EXPENSE";
    iconKey: string;
    colorHex: string;
  }) => Promise<CategoryDTO | null>;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,
  hasFetched: false,

  fetchCategories: async () => {
    if (get().hasFetched || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/categories");
      if (!res.ok) throw new Error(`Failed to load categories (${res.status})`);
      const { categories } = await res.json();
      set({ categories, isLoading: false, hasFetched: true });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createCategory: async (input) => {
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`Failed to create category (${res.status})`);
      const { category } = await res.json();
      set({ categories: [...get().categories, category] });
      return category;
    } catch (err) {
      set({ error: (err as Error).message });
      return null;
    }
  },
}));
