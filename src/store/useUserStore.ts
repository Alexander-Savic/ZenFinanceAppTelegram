import { create } from "zustand";

export type ThemeMode = "LIGHT" | "DARK" | "AUTO";
export type AccentColor = "INDIGO" | "EMERALD" | "VIOLET" | "AMBER" | "ROSE" | "CYAN";

export interface AuthenticatedUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  baseCurrency: string;
}

type AuthStatus = "idle" | "authenticating" | "authenticated" | "error";

interface UserState {
  status: AuthStatus;
  user: AuthenticatedUser | null;
  error: string | null;
  authenticate: (initData: string) => Promise<void>;
  updatePreferences: (patch: Partial<Pick<AuthenticatedUser, "themeMode" | "accentColor">>) => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  status: "idle",
  user: null,
  error: null,

  authenticate: async (initData: string) => {
    if (get().status === "authenticating" || get().status === "authenticated") return;
    set({ status: "authenticating", error: null });

    try {
      const res = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initData }),
        credentials: "include", 
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Auth failed (${res.status})`);
      }

      const { user } = await res.json();
      set({ status: "authenticated", user, error: null });
    } catch (err) {
      set({ status: "error", error: (err as Error).message });
    }
  },

  updatePreferences: (patch) => {
    const current = get().user;
    if (!current) return;
    set({ user: { ...current, ...patch } });
  },
}));
