"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, Repeat, Target, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/lib/telegram-context";

const NAV_ITEMS = [
  { href: "/", label: "Главная", icon: Home },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/subscriptions", label: "Подписки", icon: Repeat },
  { href: "/budgets", label: "Цели", icon: Target },
  { href: "/settings", label: "Настройки", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const { haptic } = useTelegram();

  return (
    <nav
      className={cn(
        "safe-area-bottom fixed inset-x-0 bottom-0 z-40 border-t",
        "border-border bg-surface/95 backdrop-blur"
      )}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2 pt-1.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                onClick={() => haptic.selection()}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition-colors",
                  isActive ? "text-accent" : "text-secondary"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
