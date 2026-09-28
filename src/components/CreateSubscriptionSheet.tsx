"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { BottomSheet } from "./BottomSheet";
import { useAccountStore } from "@/store/useAccountStore";
import { useSubscriptionStore } from "@/store/useSubscriptionStore";
import { INTERVAL_LABEL, type Interval } from "@/lib/recurrence";
import { cn } from "@/lib/utils";

const INTERVALS = Object.keys(INTERVAL_LABEL) as Interval[];

export function CreateSubscriptionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createSubscription = useSubscriptionStore((s) => s.createSubscription);
  const { accounts, fetchAccounts } = useAccountStore();

  const [name, setName] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [interval, setInterval] = useState<Interval>("MONTHLY");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && accounts.length === 0) fetchAccounts();
  }, [open, accounts.length, fetchAccounts]);

  const selectedAccountId = accountId ?? accounts[0]?.id;
  const canSubmit = name.trim() && Number(amount) > 0 && selectedAccountId && date;

  async function handleSubmit() {
    if (!canSubmit || !selectedAccountId) return;
    setIsSubmitting(true);
    const ok = await createSubscription({
      name: name.trim(),
      type,
      amount,
      accountId: selectedAccountId,
      interval,
      nextRunAt: new Date(`${date}T09:00:00`).toISOString(),
    });
    setIsSubmitting(false);
    if (ok) {
      setName("");
      setAmount("");
      setType("EXPENSE");
      setInterval("MONTHLY");
      onClose();
    }
  }

  const chip = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-xs font-medium",
      active ? "border-accent bg-accent-soft text-accent" : "border-border text-secondary"
    );

  return (
    <BottomSheet open={open} onClose={onClose} title="Новый регулярный платёж">
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-xl bg-bg p-1">
          {(["EXPENSE", "INCOME"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-sm font-medium",
                type === t ? "bg-accent text-accent-foreground" : "text-secondary"
              )}
            >
              {t === "EXPENSE" ? "Расход" : "Доход"}
            </button>
          ))}
        </div>

        <Field label="Название">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Netflix, Аренда, Зарплата"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <Field label="Сумма">
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <Field label="Счёт">
          {accounts.length === 0 ? (
            <p className="text-xs text-secondary">Сначала создайте счёт на главном экране.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAccountId(a.id)}
                  className={chip(selectedAccountId === a.id)}
                >
                  {a.name} · {a.currency}
                </button>
              ))}
            </div>
          )}
        </Field>

        <Field label="Периодичность">
          <div className="flex flex-wrap gap-2">
            {INTERVALS.map((i) => (
              <button key={i} onClick={() => setInterval(i)} className={chip(interval === i)}>
                {INTERVAL_LABEL[i]}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Ближайшая дата">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !canSubmit}
          className="mt-2 w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Сохраняем…" : "Создать"}
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