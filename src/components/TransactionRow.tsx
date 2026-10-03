"use client";

import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Trash2 } from "lucide-react";
import { useTransactionStore, type TransactionDTO } from "@/store/useTransactionStore";
import { cn } from "@/lib/utils";

function formatMoney(amount: string, currency: string) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(amount))} ${currency}`;
}

export function TransactionRow({ tx }: { tx: TransactionDTO }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);

  const isIncome = tx.type === "INCOME";
  const isTransfer = tx.type === "TRANSFER";

  const Icon = isTransfer ? ArrowLeftRight : isIncome ? ArrowDownLeft : ArrowUpRight;
  const iconColor = isTransfer ? "text-secondary" : isIncome ? "text-success" : "text-danger";
  const amountColor = isTransfer ? "text-primary" : isIncome ? "text-success" : "text-danger";
  const sign = isTransfer ? "" : isIncome ? "+" : "−";

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm("Удалить эту операцию?")) return;

    setIsDeleting(true);
    const success = await deleteTransaction(tx.id);
    setIsDeleting(false);

    if (!success) {
      alert("Не удалось удалить операцию");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface p-3 transition hover:bg-surface/80">
      <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bg", iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">
          {tx.description || (isTransfer ? "Перевод" : isIncome ? "Доход" : "Расход")}
        </p>
        <p className="truncate text-xs text-secondary">
          {new Date(tx.occurredAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
          {tx.tags && tx.tags.length > 0 && ` · ${tx.tags.map((t) => `#${t.tag.name}`).join(" ")}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className={cn("text-sm font-semibold", amountColor)}>
          {sign}
          {formatMoney(tx.amount, tx.currency)}
        </span>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-1.5 text-secondary hover:text-danger active:scale-95 disabled:opacity-50"
          title="Удалить операцию"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}