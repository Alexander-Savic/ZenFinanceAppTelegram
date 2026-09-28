"use client";

import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from "lucide-react";
import type { TransactionDTO } from "@/store/useTransactionStore";
import { cn } from "@/lib/utils";

function formatMoney(amount: string, currency: string) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(amount))} ${currency}`;
}

export function TransactionRow({ tx }: { tx: TransactionDTO }) {
  const isIncome = tx.type === "INCOME";
  const isTransfer = tx.type === "TRANSFER";

  const Icon = isTransfer ? ArrowLeftRight : isIncome ? ArrowDownLeft : ArrowUpRight;
  const iconColor = isTransfer ? "text-secondary" : isIncome ? "text-success" : "text-danger";
  const amountColor = isTransfer ? "text-primary" : isIncome ? "text-success" : "text-danger";
  const sign = isTransfer ? "" : isIncome ? "+" : "−";

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg", iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">
          {tx.description || (isTransfer ? "Перевод" : isIncome ? "Доход" : "Расход")}
        </p>
        <p className="truncate text-xs text-secondary">
          {new Date(tx.occurredAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
          {tx.tags.length > 0 && ` · ${tx.tags.map((t) => `#${t.tag.name}`).join(" ")}`}
        </p>
      </div>
      <span className={cn("shrink-0 text-sm font-semibold", amountColor)}>
        {sign}
        {formatMoney(tx.amount, tx.currency)}
      </span>
    </div>
  );
}
