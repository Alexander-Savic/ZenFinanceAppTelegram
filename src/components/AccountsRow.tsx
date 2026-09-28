"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAccountStore } from "@/store/useAccountStore";
import { AccountCard } from "./AccountCard";
import { CreateAccountSheet } from "./CreateAccountSheet";

export function AccountsRow() {
  const { accounts, isLoading, error, fetchAccounts } = useAccountStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  if (isLoading && accounts.length === 0) {
    return (
      <div className="flex gap-3 overflow-x-hidden px-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-36 w-56 shrink-0 animate-pulse rounded-2xl bg-surface-raised" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 rounded-xl bg-surface p-4 text-sm text-danger">
        Не удалось загрузить счета: {error}
      </div>
    );
  }

  return (
    <div className="flex gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
      {accounts.map((account) => (
        <AccountCard key={account.id} account={account} />
      ))}

      <button
        onClick={() => setSheetOpen(true)}
        className="flex h-36 w-32 shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-secondary"
      >
        <Plus className="h-6 w-6" />
        <span className="text-xs font-medium">Счёт</span>
      </button>

      <CreateAccountSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}