import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
} from "date-fns";

export type Period = "week" | "month" | "year";

export interface PeriodRange {
  start: Date;
  end: Date;
  /** Granularity to bucket cash-flow points at, chosen so a chart never
   *  renders more than ~12 points regardless of the period. */
  bucket: "day" | "week" | "month";
}

const WEEK_OPTS = { weekStartsOn: 1 as const }; // ISO week (Monday) — matches RU locale conventions

export function resolvePeriodRange(period: Period, anchor: Date = new Date()): PeriodRange {
  switch (period) {
    case "week":
      return {
        start: startOfWeek(anchor, WEEK_OPTS),
        end: endOfWeek(anchor, WEEK_OPTS),
        bucket: "day",
      };
    case "month":
      return { start: startOfMonth(anchor), end: endOfMonth(anchor), bucket: "day" };
    case "year":
      return { start: startOfYear(anchor), end: endOfYear(anchor), bucket: "month" };
  }
}

/** Generates the full ordered list of bucket boundaries so the chart always
 *  shows zero-value points instead of gaps where no transactions occurred. */
export function bucketBoundaries(range: PeriodRange): { key: string; label: string; start: Date }[] {
  if (range.bucket === "day") {
    return eachDayOfInterval({ start: range.start, end: range.end }).map((d) => ({
      key: format(d, "yyyy-MM-dd"),
      label: format(d, "d MMM"),
      start: d,
    }));
  }
  if (range.bucket === "week") {
    return eachWeekOfInterval({ start: range.start, end: range.end }, WEEK_OPTS).map((d) => ({
      key: format(d, "yyyy-'W'II"),
      label: format(d, "d MMM"),
      start: d,
    }));
  }
  return eachMonthOfInterval({ start: range.start, end: range.end }).map((d) => ({
    key: format(d, "yyyy-MM"),
    label: format(d, "LLL"),
    start: d,
  }));
}

export function bucketKeyFor(date: Date, bucket: PeriodRange["bucket"]): string {
  if (bucket === "day") return format(date, "yyyy-MM-dd");
  if (bucket === "week") return format(date, "yyyy-'W'II");
  return format(date, "yyyy-MM");
}
