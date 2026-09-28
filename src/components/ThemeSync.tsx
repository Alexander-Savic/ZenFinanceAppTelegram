"use client";

import { useEffect } from "react";
import { useTelegram } from "@/lib/telegram-context";
import { useUserStore } from "@/store/useUserStore";

/**
 * Single source of truth for the two DOM hooks Tailwind's tokens key off:
 *   - `.dark` class on <html> (light/dark)
 *   - `data-accent="..."` on <html> (accent color)
 *
 * AUTO mode follows Telegram's `colorScheme`, which itself follows the
 * user's Telegram app theme (or their phone's OS theme, depending on how
 * they've configured Telegram) — not the browser's prefers-color-scheme,
 * since that's frequently wrong inside the WebView.
 */
export function ThemeSync() {
  const { colorScheme } = useTelegram();
  const user = useUserStore((s) => s.user);

  useEffect(() => {
    const mode = user?.themeMode ?? "AUTO";
    const resolvedDark = mode === "DARK" || (mode === "AUTO" && colorScheme === "dark");
    document.documentElement.classList.toggle("dark", resolvedDark);
  }, [user?.themeMode, colorScheme]);

  useEffect(() => {
    const accent = (user?.accentColor ?? "INDIGO").toLowerCase();
    document.documentElement.setAttribute("data-accent", accent);
  }, [user?.accentColor]);

  return null;
}
