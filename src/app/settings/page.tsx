"use client";

import { useEffect } from "react";
import { useUserStore, type AccentColor, type ThemeMode } from "@/store/useUserStore";
import { cn } from "@/lib/utils";

const THEME_OPTIONS: { value: ThemeMode; label: string }[] = [
  { value: "LIGHT", label: "Светлая" },
  { value: "DARK", label: "Тёмная" },
  { value: "AUTO", label: "Как в Telegram" },
];

const ACCENT_OPTIONS: { value: AccentColor; hex: string }[] = [
  { value: "INDIGO", hex: "#6366f1" },
  { value: "EMERALD", hex: "#10b981" },
  { value: "VIOLET", hex: "#8b5cf6" },
  { value: "AMBER", hex: "#f59e0b" },
  { value: "ROSE", hex: "#f43f5e" },
  { value: "CYAN", hex: "#06b6d4" },
];

export default function SettingsPage() {
  const user = useUserStore((s) => s.user);
  const updatePreferences = useUserStore((s) => s.updatePreferences);

  // Синхронизация с DOM (применение темы и цвета к <html>)
  useEffect(() => {
    const root = document.documentElement;

    // 1. Применяем тему (Dark / Light / Auto)
    if (user?.themeMode === "DARK") {
      root.classList.add("dark");
    } else if (user?.themeMode === "LIGHT") {
      root.classList.remove("dark");
    } else if (user?.themeMode === "AUTO") {
      // Берём тему из Telegram WebApp, если доступно, иначе из системных настроек
      const isTelegramDark = window.Telegram?.WebApp?.colorScheme === "dark";
      const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      
      if (isTelegramDark || isSystemDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }

    // 2. Применяем акцентный цвет (приводим к нижнему регистру для globals.css)
    if (user?.accentColor) {
      root.setAttribute("data-accent", user.accentColor.toLowerCase());
    }
  }, [user?.themeMode, user?.accentColor]);

  return (
    <div className="flex flex-col gap-8 px-4 pt-6 pb-28">
      <div>
        <h1 className="text-xl font-semibold text-primary">Настройки</h1>
        {user && (
          <p className="mt-1 text-sm text-secondary">
            {user.firstName} {user.lastName ?? ""}
            {user.username ? ` · @${user.username}` : ""}
          </p>
        )}
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-secondary">Тема</h2>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updatePreferences({ themeMode: opt.value })}
              className={cn(
                "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                user?.themeMode === opt.value
                  ? "border-accent bg-accent-soft text-accent"
                  : "border-border text-secondary"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-medium text-secondary">Акцентный цвет</h2>
        <div className="flex gap-3">
          {ACCENT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updatePreferences({ accentColor: opt.value })}
              aria-label={opt.value}
              className={cn(
                "h-9 w-9 rounded-full ring-offset-2 ring-offset-bg transition-shadow",
                user?.accentColor === opt.value && "ring-2 ring-primary"
              )}
              style={{ backgroundColor: opt.hex }}
            />
          ))}
        </div>
      </section>

      <p className="text-xs text-secondary">
        Изменения сохраняются локально.
      </p>
    </div>
  );
}