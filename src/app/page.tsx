"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, FileSpreadsheet, Loader2, Wallet } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import { useAccountStore } from "@/store/useAccountStore";
import { useTransactionStore } from "@/store/useTransactionStore";
import { useCurrencyStore } from "@/store/useCurrencyStore";
import { AccountsRow } from "@/components/AccountsRow";
import { TransactionRow } from "@/components/TransactionRow";
import { AddTransactionSheet } from "@/components/AddTransactionSheet";

export default function HomePage() {
  const user = useUserStore((s) => s.user);
  const status = useUserStore((s) => s.status);

  const { accounts, fetchAccounts } = useAccountStore();
  const { recent, isLoading, fetchRecent } = useTransactionStore();
  const { fetchRates, convert, baseCurrency } = useCurrencyStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "authenticated") {
      fetchAccounts();
      fetchRecent();
      fetchRates(); 
    }
  }, [status, fetchAccounts, fetchRecent, fetchRates]);

  // Подсчет общего баланса со всех счетов с учетом курсов
  const totalBalance = accounts.reduce((sum, acc) => {
    return sum + convert(acc.balance, acc.currency, baseCurrency);
  }, 0);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Ошибка при импорте файла");
        return;
      }

      alert(`Импорт завершен! Успешно добавлено операций: ${data.count}`);
      fetchAccounts();
      fetchRecent();
    } catch (err) {
      console.error(err);
      alert("Ошибка при отправке файла");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex flex-col gap-6 pt-4 pb-28">
      {/* Скрытый input для выбора файла */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        onChange={handleFileChange}
        className="hidden"
      />

      <header className="px-4">
        <p className="text-sm text-secondary">С возвращением,</p>
        <h1 className="text-2xl font-semibold text-primary">
          {user?.firstName ?? "Друг"}
        </h1>
      </header>

      {/* Виджет общего баланса с автоконвертацией */}
      <section className="px-4">
        <div className="flex items-center justify-between rounded-2xl bg-surface p-4 shadow-sm">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium text-secondary">Общий баланс</p>
            <h2 className="text-2xl font-bold text-primary">
              {totalBalance.toLocaleString("ru-RU", {
                maximumFractionDigits: 2,
              })}{" "}
              <span className="text-lg text-accent">{baseCurrency}</span>
            </h2>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between px-4">
          <h2 className="text-sm font-medium text-secondary">Счета</h2>
        </div>
        <AccountsRow />
      </section>

      <section className="flex flex-col gap-3 px-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-secondary">
            Последние операции
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 text-xs font-medium text-accent hover:opacity-80 transition-opacity disabled:opacity-50"
            title="Загрузить выписку Excel"
          >
            {isImporting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3.5 w-3.5" />
            )}
            <span>Импорт .xlsx</span>
          </button>
        </div>

        {isLoading && recent.length === 0 && (
          <div className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-2xl bg-surface"
              />
            ))}
          </div>
        )}

        {!isLoading && recent.length === 0 && (
          <div className="rounded-2xl bg-surface p-6 text-center text-sm text-secondary">
            Пока нет операций — добавьте первую транзакцию или загрузите из файла
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

      <AddTransactionSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}