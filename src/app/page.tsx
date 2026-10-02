"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { AccountsRow } from "@/components/AccountsRow";
import { TransactionRow } from "@/components/TransactionRow";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";

export default function HomePage() {
  const user = useUserStore((s) => s.user);
  const status = useUserStore((s) => s.status);

  const fetchAccounts = useAccountStore((s) => s.fetchAccounts);
  const { recent, isLoading, fetchRecent } = useTransactionStore();

  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts();
      fetchRecent();
    }
  }, [status, fetchAccounts, fetchRecent]);

  return (
    <div className="flex flex-col gap-6 pt-4 pb-28">
      <header className="px-4">
        <p className="text-sm text-secondary">С возвращением,</p>
        <h1 className="text-2xl font-semibold text-primary">
          {user?.firstName ?? "Друг"} 👋
        </h1>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-sm font-medium text-secondary">Счета</h2>
        </div>
        <AccountsRow />
      </section>

      <section className="flex flex-col gap-3 px-4">
        <h2 className="text-sm font-medium text-secondary">Последние операции</h2>

        {isLoading && recent.length === 0 && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        )}

        {!isLoading && recent.length === 0 && (
          <div className="rounded-2xl bg-surface p-6 text-center text-sm text-secondary">
            Пока нет операций — добавьте первую транзакцию
          </div>
        )}

        <div className="flex flex-col gap-2">
          {recent.map((tx) => (
            <TransactionRow key={tx.id} tx={tx} />
          ))}
        </div>
      </section>

      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl"
        aria-label="Добавить транзакцию"
      >
        <Plus className="h-6 w-6" />
      </button>

      <AddTransactionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}