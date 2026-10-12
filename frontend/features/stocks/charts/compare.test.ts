import { describe, expect, it } from "bun:test";
import type { LinePoint } from "./chartData.ts";
import { normalizedPerformance, periodReturn } from "./compare.ts";
import { sma } from "./indicators.ts";

const DAY = 86_400_000;

describe("sma", () => {
  it("computes the rolling mean once enough points exist", () => {
    const points: LinePoint[] = [1, 2, 3, 4, 5].map((value, i) => ({ time: (i + 1) * DAY, value }));
    expect(sma(points, 3)).toEqual([
      { time: 3 * DAY, value: 2 },
      { time: 4 * DAY, value: 3 },
      { time: 5 * DAY, value: 4 },
    ]);
  });

  it("supports candle input and period 1", () => {
    const candles = [
      { time: DAY, open: 1, high: 2, low: 0.5, close: 2 },
      { time: 2 * DAY, open: 2, high: 3, low: 1, close: 4 },
    ];
    expect(sma(candles, 1)).toEqual([
      { time: DAY, value: 2 },
      { time: 2 * DAY, value: 4 },
    ]);
  });

  it("returns nothing when the period exceeds the data", () => {
    expect(sma([{ time: DAY, value: 1 }], 5)).toEqual([]);
    expect(sma([], 5)).toEqual([]);
  });
});

describe("normalizedPerformance", () => {
  it("aligns common timestamps and rebases to percent from the first common day", () => {
    const series = normalizedPerformance([
      {
        symbol: "A",
        points: [
          { time: DAY, value: 100 },
          { time: 2 * DAY, value: 110 },
          { time: 3 * DAY, value: 120 },
        ],
      },
      {
        symbol: "B",
        points: [
          { time: 2 * DAY, value: 50 },
          { time: 3 * DAY, value: 55 },
        ],
      },
    ]);
    // Only days 2 and 3 are common; B starts at day 2 (its first common point).
    expect(series[0]!.points).toEqual([
      { time: 2 * DAY, value: 0 },
      { time: 3 * DAY, value: ((120 - 110) / 110) * 100 },
    ]);
    expect(series[1]!.points).toEqual([
      { time: 2 * DAY, value: 0 },
      { time: 3 * DAY, value: 10 },
    ]);
    expect(series[1]!.totalReturn).toBe(10);
  });

  it("returns empty for empty input or no overlap", () => {
    expect(normalizedPerformance([])).toEqual([]);
    expect(
      normalizedPerformance([
        { symbol: "A", points: [{ time: DAY, value: 1 }] },
        { symbol: "B", points: [{ time: 2 * DAY, value: 1 }] },
      ]),
    ).toEqual([]);
  });
});

describe("periodReturn", () => {
  it("measures the trailing change from the nearest point at-or-after (now − days)", () => {
    const points: LinePoint[] = [
      { time: DAY, value: 100 },
      { time: 8 * DAY, value: 110 },
      { time: 20 * DAY, value: 120 },
      { time: 40 * DAY, value: 125 },
    ];
    // 1W return: from the close at day 8 to the last close.
    expect(periodReturn(points, 7)).toBeCloseTo(((125 - 110) / 110) * 100, 6);
    // A period reaching past the first point has no base — the whole window is the return.
    expect(periodReturn(points, 35)).toBe(0);
  });

  it("returns null for short windows or zero bases", () => {
    expect(periodReturn([{ time: DAY, value: 100 }], 7)).toBeNull();
    expect(
      periodReturn(
        [
          { time: DAY, value: 0 },
          { time: 2 * DAY, value: 5 },
        ],
        7,
      ),
    ).toBeNull();
    expect(
      periodReturn(
        [
          { time: DAY, value: 100 },
          { time: 2 * DAY, value: 5 },
        ],
        50,
      ),
    ).toBeNull();
  });
});
