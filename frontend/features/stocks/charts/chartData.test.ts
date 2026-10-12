import { describe, expect, it } from "bun:test";
import type { StockHistoricalRow } from "../types.ts";
import { historyToCandles, historyToLine, historyToVolume, ticksToBucketedCandles, ticksToLine, ticksToVolumeBars } from "./chartData.ts";

const DAY = 86_400_000;
/** A realistic epoch-ms base (2023-11-14); parseHistoryDate treats big numbers as ms. */
const T0 = 1_700_000_000_000;

function historyRows(rows: (number | string | undefined)[][]): StockHistoricalRow[] {
  return rows as unknown as StockHistoricalRow[];
}

describe("historyToCandles", () => {
  it("maps OHLCV tuples and normalises timestamps", () => {
    const candles = historyToCandles(
      historyRows([
        [T0, 10, 12, 9, 11, 1000, 10.9],
        [T0 + DAY, 11, 13, 10, 12, 1200, 11.8],
      ]),
    );
    expect(candles).toHaveLength(2);
    expect(candles[0]).toEqual({ time: T0, open: 10, high: 12, low: 9, close: 11 });
    expect(candles[1]!.time).toBe(T0 + DAY);
    expect(candles[1]!.close).toBe(12);
  });

  it("keeps defensive YYYY-MM-DD date strings as-is (never timezone-shifted)", () => {
    const candles = historyToCandles(historyRows([["2024-01-02", 10, 12, 9, 11, 1000, 10.9]]));
    expect(candles[0]!.time).toBe("2024-01-02");
  });

  it("drops rows without a usable time or close", () => {
    const candles = historyToCandles(
      historyRows([
        ["not-a-date", 1, 2, 0.5, 1.5, 10, 1.5],
        [T0, 1, 2, 0.5, Number.NaN, 10, 1],
      ]),
    );
    expect(candles).toHaveLength(0);
  });
});

describe("historyToLine / historyToVolume", () => {
  it("extracts closes and up/down volume", () => {
    const rows = historyRows([
      [T0, 10, 12, 9, 11, 100, 10],
      [T0 + DAY, 11, 13, 10, 9.5, 200, 10],
    ]);
    expect(historyToLine(rows)).toEqual([
      { time: T0, value: 11 },
      { time: T0 + DAY, value: 9.5 },
    ]);
    expect(historyToVolume(rows)).toEqual([
      { time: T0, value: 100, up: true },
      { time: T0 + DAY, value: 200, up: false },
    ]);
  });
});

describe("ticksToLine", () => {
  it("keeps the last price when ticks share a timestamp", () => {
    const line = ticksToLine([
      [T0, 10, 5],
      [T0 + 1000, 10.5, 8],
      [T0 + 1000, 10.75, 8],
    ]);
    expect(line).toEqual([
      { time: T0, value: 10 },
      { time: T0 + 1000, value: 10.75 },
    ]);
  });
});

describe("ticksToVolumeBars", () => {
  it("converts cumulative volume into deltas and colours by price direction", () => {
    const bars = ticksToVolumeBars([
      [T0, 10, 100],
      [T0 + 1000, 10.5, 150],
      [T0 + 2000, 10.25, 190],
    ]);
    expect(bars).toEqual([
      { time: T0, value: 100, up: true },
      { time: T0 + 1000, value: 50, up: true },
      { time: T0 + 2000, value: 40, up: false },
    ]);
  });

  it("accumulates same-timestamp deltas into one bar", () => {
    const bars = ticksToVolumeBars([
      [T0, 10, 10],
      [T0, 10.1, 25],
      [T0, 10.2, 40],
    ]);
    expect(bars).toEqual([{ time: T0, value: 40, up: true }]);
  });

  it("never goes negative when the cumulative counter resets", () => {
    const bars = ticksToVolumeBars([
      [T0, 10, 500],
      [T0 + 1000, 10.1, 3],
    ]);
    expect(bars[1]!.value).toBe(0);
  });
});

describe("ticksToBucketedCandles", () => {
  it("buckets ticks and tracks OHLC extremes", () => {
    const minute = 60_000;
    const base = Math.floor(T0 / minute) * minute; // a minute-aligned bucket edge
    const candles = ticksToBucketedCandles(
      [
        [base + minute, 10, 0],
        [base + minute + 10_000, 11, 0],
        [base + minute + 30_000, 9, 0],
        [base + minute + 59_000, 10.5, 0],
        [base + 2 * minute, 10.6, 0],
      ],
      minute,
    );
    expect(candles).toEqual([
      { time: base + minute, open: 10, high: 11, low: 9, close: 10.5 },
      { time: base + 2 * minute, open: 10.6, high: 10.6, low: 10.6, close: 10.6 },
    ]);
  });
});
