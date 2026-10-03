"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { ru } from "date-fns/locale";
import { Plus, Pause, Play, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSubscriptionStore, type SubscriptionDTO } from "@/store/useSubscriptionStore";
import { INTERVAL_LABEL, occurrencesUntil } from "@/lib/recurrence";
import { CreateSubscriptionSheet } from "@/components/CreateSubscriptionSheet";

function formatMoney(amount: string, currency: string) {
  const n = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(amount));
  return `${n} ${currency}`;
}

export default function SubscriptionsPage() {
  const { subscriptions, isLoading, error, fetchSubscriptions, toggleStatus, deleteSubscription } =
    useSubscriptionStore();
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const upcoming = useMemo(() => {
    const horizon = addDays(new Date(), 30);
    return (subscriptions || [])
      .filter((s) => s.status === "ACTIVE")
      .flatMap((s) => occurrencesUntil(s.nextRunAt, s.interval, horizon).map((date) => ({ date, sub: s })))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [subscriptions]);

  const days = useMemo(() => {
    const groups: { date: Date; items: SubscriptionDTO[] }[] = [];
    for (const { date, sub } of upcoming) {
      const last = groups[groups.length - 1];
      if (last && isSameDay(last.date, date)) last.items.push(sub);
      else groups.push({ date, items: [sub] });
    }
    return groups;
  }, [upcoming]);

  return (
    <div className="flex flex-col gap-6 px-4 pt-6 pb-24">
      <h1 className="text-xl font-semibold text-primary">Подписки</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-secondary">Календарь платежей · 30 дней</h2>
        {days.length === 0 ? (
          <div className="rounded-2xl bg-surface p-6 text-center text-sm text-secondary">
            Ближайших платежей нет
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {days.map(({ date, items }) => (
              <div key={date.toISOString()} className="flex gap-3 rounded-2xl bg-surface p-3">
                <div className="w-12 shrink-0 text-center">
                  <p className="text-lg font-semibold leading-none text-primary">{format(date, "d")}</p>
                  <p className="mt-1 text-[11px] uppercase text-secondary">{format(date, "LLL", { locale: ru })}</p>
                </div>
                <div className="flex flex-1 flex-col gap-1">
                  {items.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span className="text-primary">{s.name}</span>
                      <span className={s.type === "INCOME" ? "text-success" : "text-danger"}>
                        {s.type === "INCOME" ? "+" : "−"}
                        {formatMoney(s.amount, s.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-secondary">Все регулярные операции</h2>

        {isLoading && (subscriptions || []).length === 0 && (
          <div className="flex flex-col gap-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        )}
        {error && <p className="text-xs text-danger">{error}</p>}
        {!isLoading && (subscriptions || []).length === 0 && (
          <div className="rounded-2xl bg-surface p-6 text-center text-sm text-secondary">
            Пока нет регулярных операций — добавьте подписку или зарплату
          </div>
        )}

        {(subscriptions || []).map((s) => (
          <div
            key={s.id}
            className={cn("flex items-center justify-between rounded-2xl bg-surface p-3", s.status === "PAUSED" && "opacity-60")}
          >
            <div>
              <p className="text-sm font-medium text-primary">{s.name}</p>
              <p className="text-xs text-secondary">
                {INTERVAL_LABEL[s.interval]} · {s.account?.name ?? "Основной счет"}
                {s.status === "PAUSED" && " · на паузе"}
              </p>
              <p className="text-xs text-secondary">
                Следующий: {s.nextRunAt ? format(new Date(s.nextRunAt), "d MMM", { locale: ru }) : "—"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <span className={cn("mr-2 text-sm font-semibold", s.type === "INCOME" ? "text-success" : "text-danger")}>
                {s.type === "INCOME" ? "+" : "−"}
                {formatMoney(s.amount, s.currency)}
              </span>
              <button
                onClick={() => toggleStatus(s.id)}
                aria-label={s.status === "ACTIVE" ? "Поставить на паузу" : "Возобновить"}
                className="rounded-full p-2 text-secondary hover:bg-bg"
              >
                {s.status === "ACTIVE" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </button>
              <button
                onClick={() => deleteSubscription(s.id)}
                aria-label="Удалить"
                className="rounded-full p-2 text-danger hover:bg-bg"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </section>

      <button
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-xl"
        aria-label="Новая подписка"
      >
        <Plus className="h-6 w-6" />
      </button>

      <CreateSubscriptionSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}