import { parseHistoryDate } from "../formatters.ts";
import type { StockHistoricalRow, StockPriceTicksRow } from "../types.ts";

/**
 * Chart data points. `time` is epoch milliseconds (intraday) or a local
 * `'YYYY-MM-DD'` date string (daily bars — kept as a string so timezones can
 * never shift a session date by a day).
 */
export interface CandlePoint {
  time: number | string;
  open: number;
  high: number;
  low: number;
  close: number;
}
export interface LinePoint {
  time: number | string;
  value: number;
}
export interface VolumePoint {
  time: number | string;
  value: number;
  /** Up bars (close ≥ open / price rising) render green, the rest red. */
  up: boolean;
}

function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? v : Number.NaN;
}

/** Numeric timestamps are normalised to ms; only plain `YYYY-MM-DD` strings pass through. */
function pointTime(v: number | string): number | string {
  if (typeof v !== "string") return parseHistoryDate(v);
  return /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : "";
}

/** Daily history rows `[ts, open, high, low, close, volume, adjClose]` → candles. */
export function historyToCandles(rows: StockHistoricalRow[]): CandlePoint[] {
  return rows
    .map(row => ({
      time: pointTime(row[0]),
      open: num(row[1]),
      high: num(row[2]),
      low: num(row[3]),
      close: num(row[4]),
    }))
    .filter(point => point.time !== 0 && point.time !== "" && !Number.isNaN(point.close));
}

/** Daily history closes as a line. */
export function historyToLine(rows: StockHistoricalRow[]): LinePoint[] {
  return historyToCandles(rows).map(point => ({ time: point.time, value: point.close }));
}

/** Daily history volume as up/down bars. */
export function historyToVolume(rows: StockHistoricalRow[]): VolumePoint[] {
  return rows
    .map(row => {
      const open = num(row[1]);
      const close = num(row[4]);
      return { time: pointTime(row[0]), value: num(row[5]) || 0, up: Number.isNaN(open) || close >= open };
    })
    .filter(point => point.time !== 0 && point.time !== "");
}

/**
 * Intraday ticks `[ts, price, cumulativeVolume]` → a price line. Tick timestamps
 * are epoch ms in practice but some feeds send µs/ns; parseHistoryDate normalises.
 */
export function ticksToLine(ticks: StockPriceTicksRow[]): LinePoint[] {
  const out: LinePoint[] = [];
  for (const tick of ticks) {
    const time = parseHistoryDate(tick[0]);
    const value = num(tick[1]);
    if (Number.isNaN(time) || Number.isNaN(value)) continue;
    const last = out[out.length - 1];
    if (last && last.time === time) last.value = value;
    else out.push({ time, value });
  }
  return out;
}

/**
 * Tick volume is cumulative per session, so the per-tick delta is what a volume
 * pane wants. The first tick's cumulative value is its session total so far.
 */
export function ticksToVolumeBars(ticks: StockPriceTicksRow[]): VolumePoint[] {
  const out: VolumePoint[] = [];
  let previousCumulative = 0;
  let previousPrice = Number.NaN;
  for (const tick of ticks) {
    const time = parseHistoryDate(tick[0]);
    const price = num(tick[1]);
    const cumulative = num(tick[2]) || 0;
    if (Number.isNaN(time) || Number.isNaN(price)) continue;
    const delta = out.length === 0 ? cumulative : Math.max(0, cumulative - previousCumulative);
    previousCumulative = cumulative;
    const up = Number.isNaN(previousPrice) ? true : price >= previousPrice;
    previousPrice = price;
    const last = out[out.length - 1];
    if (last && last.time === time) last.value += delta;
    else out.push({ time, value: delta, up });
  }
  return out;
}

/**
 * Bucket raw ticks into time-bucketed candles (default 1 minute) so intraday
 * candlesticks are possible even though the API only exposes daily OHLC.
 */
export function ticksToBucketedCandles(ticks: StockPriceTicksRow[], bucketMs = 60_000): CandlePoint[] {
  const buckets: CandlePoint[] = [];
  for (const tick of ticks) {
    const time = parseHistoryDate(tick[0]);
    const price = num(tick[1]);
    if (Number.isNaN(time) || Number.isNaN(price)) continue;
    const bucketTime = Math.floor(time / bucketMs) * bucketMs;
    const bucket = buckets[buckets.length - 1];
    if (!bucket || bucket.time !== bucketTime) {
      buckets.push({ time: bucketTime, open: price, high: price, low: price, close: price });
    } else {
      bucket.high = Math.max(bucket.high, price);
      bucket.low = Math.min(bucket.low, price);
      bucket.close = price;
    }
  }
  return buckets;
}
