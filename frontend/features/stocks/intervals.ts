import { historyRange } from "./formatters.ts";

/**
 * Chart intervals. Intraday intervals render from raw price ticks; daily ones
 * from getPriceHistory over the matching month window.
 */
export interface IntervalDef {
  key: string;
  label: string;
  kind: "ticks" | "daily";
  /** Months of daily history to fetch (daily intervals only). */
  months?: number;
  /** Tick intervals only keep this many most-recent ticks (the feed sends the whole session). */
  maxTicks?: number;
}

export const INTERVALS: readonly IntervalDef[] = [
  { key: "1D", label: "1D", kind: "ticks", maxTicks: 1200 },
  { key: "5D", label: "5D", kind: "ticks" },
  { key: "1M", label: "1M", kind: "daily", months: 1 },
  { key: "3M", label: "3M", kind: "daily", months: 3 },
  { key: "6M", label: "6M", kind: "daily", months: 6 },
  { key: "1Y", label: "1Y", kind: "daily", months: 12 },
];

export const DEFAULT_INTERVAL = "3M";

export function intervalByKey(key: string): IntervalDef {
  return INTERVALS.find(interval => interval.key === key) ?? INTERVALS[2]!;
}

/** The history fetch params for a daily interval. */
export function intervalHistoryRange(interval: IntervalDef): { from: string; to: string } {
  return historyRange(interval.months ?? 3);
}
