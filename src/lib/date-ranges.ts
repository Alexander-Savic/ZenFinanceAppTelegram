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
  bucket: "day" | "week" | "month";
}

const WEEK_OPTS = { weekStartsOn: 1 as const }; 

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
