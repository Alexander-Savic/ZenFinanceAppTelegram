"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { BottomSheet } from "./BottomSheet";
import { cn } from "@/lib/utils";
import { useTelegram } from "@/lib/telegram-context";
import { useAccountStore } from "@/store/useAccountStore";
import { useCategoryStore } from "@/store/useCategoryStore";
import { useTagStore } from "@/store/useTagStore";
import { useTransactionStore, type CreateTransactionInput } from "@/store/useTransactionStore";
import { useExchangeRates } from "@/hooks/useExchangeRates";

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";

const TYPE_LABEL: Record<TxType, string> = {
  EXPENSE: "Расход",
  INCOME: "Доход",
  TRANSFER: "Перевод",
};

export function AddTransactionSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { mainButton, backButton, haptic } = useTelegram();
  const { accounts, fetchAccounts } = useAccountStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { tags, fetchTags, getOrCreateTag } = useTagStore();
  const { createTransaction, isSubmitting, error } = useTransactionStore();
  const { getRate, isLoading: ratesLoading } = useExchangeRates();

  const [type, setType] = useState<TxType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string>("");
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [description, setDescription] = useState("");
  const [exchangeRateOverride, setExchangeRateOverride] = useState<string>("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchAccounts();
    fetchCategories();
    fetchTags();
  }, [open, fetchAccounts, fetchCategories, fetchTags]);

  // Reset to a clean form each time the sheet is opened.
  useEffect(() => {
    if (!open) return;
    setType("EXPENSE");
    setAmount("");
    setCategoryId(undefined);
    setSelectedTagIds([]);
    setTagInput("");
    setDescription("");
    setExchangeRateOverride("");
    setLocalError(null);
  }, [open]);

  useEffect(() => {
    const firstAccountId = accounts[0]?.id;
    if (!firstAccountId) return;

    const secondAccountId = accounts[1]?.id || firstAccountId;

    setAccountId((prev) => prev || firstAccountId);
    setFromAccountId((prev) => prev || firstAccountId);
    setToAccountId((prev) => prev || secondAccountId);
  }, [accounts]);

  const relevantCategories = useMemo(
    () => categories.filter((c) => c.type === (type === "INCOME" ? "INCOME" : "EXPENSE")),
    [categories, type]
  );

  const fromAccount = accounts.find((a) => a.id === (type === "TRANSFER" ? fromAccountId : accountId));
  const toAccount = accounts.find((a) => a.id === toAccountId);
  const needsConversion =
    type === "TRANSFER" && fromAccount && toAccount && fromAccount.currency !== toAccount.currency;

  const autoRate = useMemo(() => {
    if (!needsConversion || !fromAccount || !toAccount) return null;
    return getRate(fromAccount.currency, toAccount.currency);
  }, [needsConversion, fromAccount, toAccount, getRate]);

  const effectiveRate = exchangeRateOverride ? Number(exchangeRateOverride) : autoRate;
  const creditedPreview =
    needsConversion && effectiveRate && amount ? (Number(amount) * effectiveRate).toFixed(2) : null;

  async function handleToggleTag(id: string) {
    haptic.selection();
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]));
  }

  async function handleAddNewTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    const tag = await getOrCreateTag(trimmed);
    if (tag) {
      setSelectedTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
      setTagInput("");
    }
  }

  function validate(): string | null {
    if (!amount || Number(amount) <= 0) return "Введите сумму больше нуля";
    if (type === "TRANSFER") {
      if (!fromAccountId || !toAccountId) return "Выберите оба счёта";
      if (fromAccountId === toAccountId) return "Счета перевода должны различаться";
      if (needsConversion && !effectiveRate) return "Укажите курс конвертации";
    } else if (!accountId) {
      return "Выберите счёт";
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setLocalError(validationError);
      haptic.notify("error");
      return;
    }
    setLocalError(null);

    const input: CreateTransactionInput =
      type === "TRANSFER"
        ? {
            type: "TRANSFER",
            fromAccountId,
            toAccountId,
            amount,
            currency: fromAccount!.currency,
            exchangeRate: needsConversion ? String(effectiveRate) : undefined,
            description: description.trim() || undefined,
            tagIds: selectedTagIds,
          }
        : {
            type,
            accountId,
            categoryId,
            amount,
            currency: fromAccount!.currency,
            description: description.trim() || undefined,
            tagIds: selectedTagIds,
          };

    const result = await createTransaction(input);
    if (result.ok) {
      haptic.notify("success");
      onClose();
    } else {
      haptic.notify("error");
    }
  }

  // Native MainButton mirrors the in-sheet submit button; wired only while open.
  useEffect(() => {
    if (!open) {
      mainButton.hide();
      return;
    }
    const label = amount ? `Сохранить · ${amount} ${fromAccount?.currency ?? ""}` : "Сохранить";
    mainButton.show(label, handleSubmit);
    mainButton.setLoading(isSubmitting);
    return () => mainButton.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, amount, fromAccount?.currency, isSubmitting, type, accountId, fromAccountId, toAccountId, categoryId, selectedTagIds, description, exchangeRateOverride]);

  useEffect(() => {
    if (!open) return;
    backButton.show(onClose);
    return () => backButton.hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <BottomSheet open={open} onClose={onClose} title="Новая операция">
      <div className="flex flex-col gap-4">
        <div className="flex gap-1 rounded-xl bg-bg p-1">
          {(Object.keys(TYPE_LABEL) as TxType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                haptic.selection();
                setType(t);
              }}
              className={cn(
                "flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors",
                type === t ? "bg-accent text-accent-foreground" : "text-secondary"
              )}
            >
              {TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <Field label="Сумма">
          <input
            autoFocus
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0"
            className="w-full rounded-xl border border-border bg-bg px-3 py-3 text-lg font-semibold text-primary"
          />
        </Field>

        {type === "TRANSFER" ? (
          <>
            <Field label="Со счёта">
              <AccountSelect
                accounts={accounts}
                value={fromAccountId}
                onChange={setFromAccountId}
              />
            </Field>
            <Field label="На счёт">
              <AccountSelect accounts={accounts} value={toAccountId} onChange={setToAccountId} />
            </Field>

            {needsConversion && (
              <Field label={`Курс (${fromAccount?.currency} → ${toAccount?.currency})`}>
                <input
                  inputMode="decimal"
                  value={exchangeRateOverride}
                  onChange={(e) => setExchangeRateOverride(e.target.value.replace(/[^0-9.]/g, ""))}
                  placeholder={ratesLoading ? "Загрузка…" : autoRate?.toString() ?? "Введите курс"}
                  className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
                />
                {creditedPreview && (
                  <p className="mt-1 text-xs text-secondary">
                    Зачислится ≈ {creditedPreview} {toAccount?.currency}
                  </p>
                )}
              </Field>
            )}
          </>
        ) : (
          <>
            <Field label="Счёт">
              <AccountSelect accounts={accounts} value={accountId} onChange={setAccountId} />
            </Field>

            <Field label="Категория">
              <div className="flex flex-wrap gap-2">
                {relevantCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCategoryId(categoryId === c.id ? undefined : c.id)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium",
                      categoryId === c.id
                        ? "border-transparent text-white"
                        : "border-border text-secondary"
                    )}
                    style={categoryId === c.id ? { backgroundColor: c.colorHex } : undefined}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </Field>
          </>
        )}

        <Field label="Теги">
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => (
              <button
                key={t.id}
                onClick={() => handleToggleTag(t.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium",
                  selectedTagIds.includes(t.id)
                    ? "border-accent bg-accent-soft text-accent"
                    : "border-border text-secondary"
                )}
              >
                #{t.name}
              </button>
            ))}
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddNewTag();
                }
              }}
              placeholder="Новый тег"
              className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-3 py-1.5 text-sm text-primary"
            />
            <button
              onClick={handleAddNewTag}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-secondary"
            >
              Добавить
            </button>
          </div>
        </Field>

        <Field label="Описание (необязательно)">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например, Кофе с коллегами"
            className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
          />
        </Field>

        {(localError || error) && (
          <p className="text-sm text-danger">{localError ?? error}</p>
        )}

        {/* Fallback submit for non-Telegram/dev contexts where MainButton isn't rendered. */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-foreground disabled:opacity-50"
        >
          {isSubmitting ? "Сохраняем…" : "Сохранить"}
        </button>
      </div>
    </BottomSheet>
  );
}

function AccountSelect({
  accounts,
  value,
  onChange,
}: {
  accounts: { id: string; name: string; currency: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-bg px-3 py-2.5 text-sm text-primary"
    >
      {accounts.map((a) => (
        <option key={a.id} value={a.id}>
          {a.name} · {a.currency}
        </option>
      ))}
    </select>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-secondary">{label}</span>
      {children}
    </label>
  );
}
