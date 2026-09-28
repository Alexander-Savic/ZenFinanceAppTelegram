"use client";

import { Wallet, CreditCard, Bitcoin, PiggyBank, TrendingUp } from "lucide-react";
import type { AccountDTO } from "@/store/useAccountStore";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<AccountDTO["type"], typeof Wallet> = {
  CASH: Wallet,
  CARD: CreditCard,
  CRYPTO: Bitcoin,
  SAVINGS: PiggyBank,
  INVESTMENT: TrendingUp,
};

const DEFAULT_GRADIENT: Record<AccountDTO["type"], [string, string]> = {
  CASH: ["#22c55e", "#16a34a"],
  CARD: ["#6366f1", "#4338ca"],
  CRYPTO: ["#f59e0b", "#b45309"],
  SAVINGS: ["#06b6d4", "#0e7490"],
  INVESTMENT: ["#8b5cf6", "#6d28d9"],
};

function formatBalance(balance: string, currency: string) {
  const value = Number(balance);
  const formatted = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: currency === "BTC" || currency === "ETH" ? 4 : 2,
    maximumFractionDigits: currency === "BTC" || currency === "ETH" ? 6 : 2,
  }).format(value);
  return `${formatted} ${currency}`;
}

export function AccountCard({ account }: { account: AccountDTO }) {
  const Icon = TYPE_ICON[account.type];
  const [start, end] = DEFAULT_GRADIENT[account.type];
  const gradientStart = account.colorGradientStart ?? start;
  const gradientEnd = account.colorGradientEnd ?? end;

  const balanceNum = Number(account.balance);
  const limitNum = account.monthlyLimit ? Number(account.monthlyLimit) : null;
  const usagePct = limitNum ? Math.min(100, (balanceNum / limitNum) * 100) : null;
  const isNearLimit = usagePct !== null && usagePct >= 80;

  return (
    <div
      className="relative flex h-36 w-56 shrink-0 flex-col justify-between overflow-hidden rounded-2xl p-4 text-white shadow-lg"
      style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium opacity-90">{account.name}</span>
        <Icon className="h-5 w-5 opacity-90" />
      </div>

      <div>
        <p className="text-xl font-semibold tracking-tight">
          {formatBalance(account.balance, account.currency)}
        </p>
        {account.maskedNumber && (
          <p className="mt-0.5 text-xs tracking-wider opacity-75">{account.maskedNumber}</p>
        )}
      </div>

      {usagePct !== null && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/25">
          <div
            className={cn("h-full rounded-full", isNearLimit ? "bg-amber-300" : "bg-white")}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      )}
    </div>
  );
}
