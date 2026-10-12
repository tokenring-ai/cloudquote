import type { CandlePoint, LinePoint } from "./chartData.ts";

/** Simple moving average over the close/value of the given points. */
export function sma(points: CandlePoint[] | LinePoint[], period: number): LinePoint[] {
  if (period < 1) return [];
  const values = points.map(point => ("close" in point ? point.close : point.value));
  const out: LinePoint[] = [];
  let sum = 0;
  for (let i = 0; i < points.length; i++) {
    sum += values[i]!;
    if (i >= period) sum -= values[i - period]!;
    if (i >= period - 1) out.push({ time: points[i]!.time, value: sum / period });
  }
  return out;
}

export interface OverlaySeries {
  /** Legend label, e.g. "SMA 50". */
  label: string;
  color: string;
  points: LinePoint[];
}
