"use client";

import { useEffect } from "react";
import { useTelegram } from "@/lib/telegram-context";
import { useUserStore } from "@/store/useUserStore";

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
