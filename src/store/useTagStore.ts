import { create } from "zustand";

export interface TagDTO {
  id: string;
  name: string;
  colorHex: string | null;
}

interface TagState {
  tags: TagDTO[];
  isLoading: boolean;
  hasFetched: boolean;
  fetchTags: () => Promise<void>;
  getOrCreateTag: (name: string) => Promise<TagDTO | null>;
}

export const useTagStore = create<TagState>((set, get) => ({
  tags: [],
  isLoading: false,
  hasFetched: false,

  fetchTags: async () => {
    if (get().hasFetched || get().isLoading) return;
    set({ isLoading: true });
    try {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to load tags");
      const { tags } = await res.json();
      set({ tags, isLoading: false, hasFetched: true });
    } catch {
      set({ isLoading: false });
    }
  },

  getOrCreateTag: async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const existing = get().tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;

    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    if (!res.ok) return null;
    const { tag } = await res.json();
    set({ tags: [...get().tags, tag] });
    return tag;
  },
}));
