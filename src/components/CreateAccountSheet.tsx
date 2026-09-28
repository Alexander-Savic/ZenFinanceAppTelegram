"use client";

import { useState } from "react";
import { Wallet, CreditCard, Bitcoin, PiggyBank, TrendingUp } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { useAccountStore, type AccountDTO } from "@/store/useAccountStore";
import { cn } from "@/lib/utils";

const TYPES: { value: AccountDTO["type"]; label: string; icon: typeof Wallet }[] = [
  { value: "CASH", label: "Наличные", icon: Wallet },
  { value: "CARD", label: "Карта", icon: CreditCard },
  { value: "CRYPTO", label: "Крипто", icon: Bitcoin },
  { value: "SAVINGS", label: "Кошелёк", icon: PiggyBank },
  { value: "INVESTMENT", label: "Инвестиции", icon: TrendingUp },
];

const CURRENCIES = ["RUB", "USD", "EUR", "BYN", "USDT", "BTC", "ETH", "GBP", "KZT"];

export function CreateAccountSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createAccount = useAccountStore((s) => s.createAccount);

  const [name, setName] = useState("");
  const [type, setType] = useState<AccountDTO["type"]>("CARD");
  const [currency, setCurrency] = useState("RUB");
  const [initialBalance, setInitialBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function reset() {
    setName("");
    setType("CARD");
    setCurrency("RUB");
    setInitialBalance("");
  }

  async function handleSubmit() {
    if (!name.trim()) return;
    setIsSubmitting(true);
    const ok = await createAccount({
      name: name.trim(),
      type,
      currency,
      initialBalance: initialBalance || "0",
    });
    setIsSubmitting(false);
    if (ok) {
      reset();
      onClose();
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Новый счёт">
      <div className="flex flex-col gap-4">
        <Field label="Название">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Visa Gold, Tether, Кошелек"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <Field label="Тип счёта">
          <div className="flex flex-wrap gap-2">
            {TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setType(value)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium",
                  type === value ? "border-accent bg-accent-soft text-accent" : "border-border text-secondary"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Валюта">
          <div className="flex flex-wrap gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => setCurrency(c)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  currency === c ? "border-accent bg-accent-soft text-accent" : "border-border text-secondary"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Начальный баланс">
          <input
            inputMode="decimal"
            value={initialBalance}
            onChange={(e) => setInitialBalance(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
          className="mt-2 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Создаём…" : "Создать счёт"}
        </button>
      </div>
    </BottomSheet>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-secondary">{label}</span>
      {children}
    </label>
  );
}