import type { LinePoint } from "./chartData.ts";

export interface CompareInput {
  symbol: string;
  /** Close-price series for one symbol, any shared time base (epoch ms). */
  points: LinePoint[];
}

export interface CompareSeries {
  symbol: string;
  /** Percent change vs the first common timestamp (0 at the base). */
  points: LinePoint[];
  /** Return over the whole aligned window, in percent. */
  totalReturn: number | null;
}

/** Percent-change ms clock for either timestamp form; date strings are local midnight. */
function toMs(time: number | string): number {
  return typeof time === "string" ? Date.parse(`${time}T00:00:00`) : time;
}

/**
 * Aligns several symbols' series onto their common timestamps and re-bases each
 * to percent-change from the first common point, so different price levels can
 * be overlaid meaningfully.
 */
export function normalizedPerformance(inputs: CompareInput[]): CompareSeries[] {
  const usable = inputs.filter(input => input.points.length > 0);
  if (usable.length === 0) return [];

  const byTime = usable.map(input => new Map(input.points.map(point => [point.time, point.value])));
  const commonTimes = [...byTime[0]!.keys()].filter(time => byTime.every(map => map.has(time)));
  // Date-string times sort correctly lexicographically; numbers numerically.
  commonTimes.sort((a, b) => (toMs(a) > toMs(b) ? 1 : toMs(a) < toMs(b) ? -1 : 0));
  if (commonTimes.length === 0) return [];

  const baseTime = commonTimes[0]!;
  return usable.map((input, index) => {
    const base = byTime[index]!.get(baseTime)!;
    const points = commonTimes.map(time => ({
      time,
      value: base !== 0 ? ((byTime[index]!.get(time)! - base) / base) * 100 : 0,
    }));
    const last = points[points.length - 1]!.value;
    return { symbol: input.symbol, points, totalReturn: points.length > 1 ? last : null };
  });
}

/** Percent change between the closes ~`days` apart (nearest points), or null if the window is short. */
export function periodReturn(points: LinePoint[], days: number): number | null {
  if (points.length < 2) return null;
  const first = toMs(points[0]!.time);
  const last = points[points.length - 1]!;
  const target = first + days * 86_400_000;
  if (toMs(last.time) < target) return null;
  // Nearest point at-or-after the target date.
  let start: LinePoint | undefined;
  for (const point of points) {
    if (toMs(point.time) >= target) {
      start = point;
      break;
    }
  }
  if (!start || start.value === 0) return null;
  return ((last.value - start.value) / start.value) * 100;
}
