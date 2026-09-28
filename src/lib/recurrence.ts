import { addDays, addWeeks, addMonths, addQuarters, addYears } from "date-fns";

export type Interval = "DAILY" | "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";

export const INTERVAL_LABEL: Record<Interval, string> = {
  DAILY: "Каждый день",
  WEEKLY: "Каждую неделю",
  BIWEEKLY: "Раз в 2 недели",
  MONTHLY: "Каждый месяц",
  QUARTERLY: "Раз в квартал",
  YEARLY: "Каждый год",
};

export function advance(date: Date, interval: Interval): Date {
  switch (interval) {
    case "DAILY": return addDays(date, 1);
    case "WEEKLY": return addWeeks(date, 1);
    case "BIWEEKLY": return addWeeks(date, 2);
    case "MONTHLY": return addMonths(date, 1);
    case "QUARTERLY": return addQuarters(date, 1);
    case "YEARLY": return addYears(date, 1);
  }
}

/** Все срабатывания подписки от nextRunAt до horizon (включительно). */
export function occurrencesUntil(nextRunAt: string, interval: Interval, horizon: Date): Date[] {
  const result: Date[] = [];
  let cursor = new Date(nextRunAt);
  let guard = 0;
  while (cursor <= horizon && guard < 100) {
    result.push(cursor);
    cursor = advance(cursor, interval);
    guard++;
  }
  return result;
}