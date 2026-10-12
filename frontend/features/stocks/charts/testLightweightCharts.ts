import { mock } from "bun:test";

/**
 * jsdom has no canvas, so any test that mounts a real chart fakes the whole
 * lightweight-charts module. `calls` records what the wrapper fed the lib.
 */
export const chartFakeCalls = {
  createChart: 0,
  setData: [] as { seriesKind: string; data: unknown[] }[],
  removed: 0,
};

export function resetChartFakeCalls() {
  chartFakeCalls.createChart = 0;
  chartFakeCalls.setData = [];
  chartFakeCalls.removed = 0;
}

export function mockLightweightCharts(): void {
  void mock.module("lightweight-charts", () => ({
    createChart: () => {
      chartFakeCalls.createChart += 1;
      return {
        addSeries: (definition: { __kind: string }) => ({
          setData: (data: unknown[]) => chartFakeCalls.setData.push({ seriesKind: definition.__kind, data }),
          priceScale: () => ({ applyOptions: () => {} }),
        }),
        subscribeCrosshairMove: () => {},
        unsubscribeCrosshairMove: () => {},
        applyOptions: () => {},
        priceScale: () => ({ applyOptions: () => {} }),
        timeScale: () => ({ fitContent: () => {} }),
        remove: () => {
          chartFakeCalls.removed += 1;
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
}
