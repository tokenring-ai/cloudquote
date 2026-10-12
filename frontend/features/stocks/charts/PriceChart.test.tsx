import { beforeEach, describe, expect, it, mock } from "bun:test";
import { render, waitFor } from "@testing-library/react";

/**
 * jsdom has no canvas, so the whole lightweight-charts module is faked. The fake
 * records every setData call so tests can assert the exact times/shapes the
 * wrapper feeds the chart lib.
 */
const calls = {
  createChart: 0,
  setData: [] as { seriesKind: string; data: unknown[] }[],
  logMode: [] as unknown[],
  removed: 0,
};

function makeSeries(kind: string) {
  return {
    setData(data: unknown[]) {
      calls.setData.push({ seriesKind: kind, data });
    },
    priceScale: () => ({ applyOptions: () => {} }),
  };
}

void mock.module("lightweight-charts", () => ({
  createChart: () => {
    calls.createChart += 1;
    const seriesKinds: string[] = [];
    return {
      addSeries: (definition: { __kind: string }, _options: unknown) => {
        const series = makeSeries(definition.__kind);
        seriesKinds.push(definition.__kind);
        return series;
      },
      subscribeCrosshairMove: () => {},
      unsubscribeCrosshairMove: () => {},
      applyOptions: () => {},
      priceScale: () => ({
        applyOptions: (options: { mode?: unknown }) => {
          calls.logMode.push(options.mode);
        },
      }),
      timeScale: () => ({ fitContent: () => {} }),
      remove: () => {
        calls.removed += 1;
      },
    };
  },
  CandlestickSeries: { __kind: "candles" },
  LineSeries: { __kind: "line" },
  AreaSeries: { __kind: "area" },
  HistogramSeries: { __kind: "volume" },
  ColorType: { Solid: "solid" },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Solid: 0 },
  PriceScaleMode: { Normal: 0, Logarithmic: 1 },
}));

const { default: PriceChart } = await import("./PriceChart.tsx");

beforeEach(() => {
  calls.createChart = 0;
  calls.setData = [];
  calls.logMode = [];
  calls.removed = 0;
});

describe("PriceChart", () => {
  it("feeds daily candle data as date strings plus a volume series", async () => {
    const { container, unmount } = render(
      <PriceChart
        type="candles"
        candles={[
          { time: "2024-01-02", open: 10, high: 12, low: 9, close: 11 },
          { time: "2024-01-03", open: 11, high: 13, low: 10, close: 12 },
        ]}
        volume={[
          { time: "2024-01-02", value: 100, up: true },
          { time: "2024-01-03", value: 120, up: false },
        ]}
        overlays={[{ label: "SMA 50", color: "#6366f1", points: [{ time: "2024-01-02", value: 10.5 }] }]}
      />,
    );
    await waitFor(() => expect(calls.setData.length).toBeGreaterThanOrEqual(3));

    const candleSet = calls.setData.find(set => set.seriesKind === "candles");
    expect(candleSet?.data).toEqual([
      { time: "2024-01-02", open: 10, high: 12, low: 9, close: 11 },
      { time: "2024-01-03", open: 11, high: 13, low: 10, close: 12 },
    ]);
    const volumeSet = calls.setData.find(set => set.seriesKind === "volume");
    expect(volumeSet?.data).toHaveLength(2);
    const overlaySet = calls.setData.find(set => set.seriesKind === "line");
    expect(overlaySet?.data).toEqual([{ time: "2024-01-02", value: 10.5 }]);

    // The legend shows the last bar's OHLC + volume.
    expect(container.textContent).toContain("O");
    expect(container.textContent).toContain("12");
    expect(container.textContent).toContain("Vol 120");
    expect(container.textContent).toContain("SMA 50");
    unmount();
    expect(calls.removed).toBe(1);
  });

  it("converts intraday epoch-ms data to UTC-second timestamps", async () => {
    const { unmount } = render(
      <PriceChart
        type="line"
        timeKind="intraday"
        line={[
          { time: 1_700_000_100_000, value: 10 },
          { time: 1_700_000_200_000, value: 10.5 },
        ]}
      />,
    );
    await waitFor(() => expect(calls.setData.length).toBeGreaterThanOrEqual(1));
    const lineSet = calls.setData.find(set => set.seriesKind === "line");
    expect(lineSet?.data).toEqual([
      { time: 1_700_000_100, value: 10 },
      { time: 1_700_000_200, value: 10.5 },
    ]);
    unmount();
  });

  it("sorts unsorted input before handing it to the chart lib", async () => {
    const { unmount } = render(
      <PriceChart
        type="line"
        line={[
          { time: "2024-01-05", value: 2 },
          { time: "2024-01-02", value: 1 },
        ]}
      />,
    );
    await waitFor(() => expect(calls.setData.length).toBeGreaterThanOrEqual(1));
    const times = calls.setData.find(set => set.seriesKind === "line")!.data.map(point => (point as { time: string }).time);
    expect(times).toEqual(["2024-01-02", "2024-01-05"]);
    unmount();
  });
});
