import {
  AreaSeries,
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  HistogramSeries,
  type IChartApi,
  type ISeriesApi,
  LineSeries,
  LineStyle,
  type MouseEventParams,
  PriceScaleMode,
  type Time,
  type UTCTimestamp,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState } from "react";
import { fmtPrice, fmtVol, toLocalIsoDate } from "../formatters.ts";
import type { CandlePoint, LinePoint, VolumePoint } from "./chartData.ts";
import type { OverlaySeries } from "./indicators.ts";

export type ChartType = "candles" | "line" | "area";

const UP_COLOR = "#10b981";
const DOWN_COLOR = "#ef4444";
const VOLUME_UP = "rgba(16, 185, 129, 0.45)";
const VOLUME_DOWN = "rgba(239, 68, 68, 0.45)";

export interface PriceChartProps {
  type?: ChartType;
  candles?: CandlePoint[];
  line?: LinePoint[];
  volume?: VolumePoint[];
  overlays?: OverlaySeries[];
  /** "date" for daily bars (YYYY-MM-DD axis), "intraday" for tick timestamps (HH:MM axis). */
  timeKind?: "date" | "intraday";
  logScale?: boolean;
  /** Chart height in px. */
  height?: number;
  /** OHLCV legend that follows the crosshair. Default true. */
  showLegend?: boolean;
  className?: string;
}

interface LegendState {
  open?: number | undefined;
  high?: number | undefined;
  low?: number | undefined;
  close?: number | undefined;
  value?: number | undefined;
  volume?: number | undefined;
  overlays: { label: string; value: number; color: string }[];
}

function toTime(time: number | string, kind: "date" | "intraday"): Time {
  if (typeof time === "string") return time;
  if (kind === "date") return toLocalIsoDate(new Date(time));
  return Math.floor(time / 1000) as UTCTimestamp;
}

/** Ascending unique times are required by the chart lib; be defensive about input order. */
function sortedByTime<T extends { time: number | string }>(points: T[]): T[] {
  return [...points].sort((a, b) => (a.time > b.time ? 1 : a.time < b.time ? -1 : 0));
}

function formatIntradayTime(seconds: number): string {
  return new Date(seconds * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * Interactive price chart (lightweight-charts): candles/line/area + volume pane
 * + moving-average overlays, crosshair legend, pan/zoom and log scale. Owns the
 * chart instance lifecycle; data updates go through setData without rebuilds.
 */
export default function PriceChart({
  type = "area",
  candles,
  line,
  volume,
  overlays,
  timeKind = "date",
  logScale = false,
  height = 300,
  showLegend = true,
  className,
}: PriceChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const mainSeriesRef = useRef<ISeriesApi<"Candlestick" | "Line" | "Area"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const overlaySeriesRef = useRef<ISeriesApi<"Line">[]>([]);
  const dataRef = useRef<{ candles: CandlePoint[]; line: LinePoint[]; volume: VolumePoint[]; overlays: OverlaySeries[] }>({
    candles: [],
    line: [],
    volume: [],
    overlays: [],
  });
  const [legend, setLegend] = useState<LegendState | null>(null);

  const structured = useMemo(() => {
    const candleData = sortedByTime(candles ?? []);
    const lineData = sortedByTime(line ?? []);
    return {
      candles: candleData,
      line: lineData,
      volume: sortedByTime(volume ?? []),
      overlays: (overlays ?? []).map(series => ({ ...series, points: sortedByTime(series.points) })),
    };
  }, [candles, line, volume, overlays]);
  dataRef.current = structured;

  // (Re)build the chart when the structural shape changes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgb(148 163 184)", // muted slate
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.12)" },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderVisible: false,
        scaleMargins: volume && volume.length > 0 ? { top: 0.25, bottom: 0.22 } : { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderVisible: false,
        ...(timeKind === "intraday"
          ? {
              tickMarkFormatter: (t: Time) => formatIntradayTime(Number(t)),
              secondsVisible: false,
            }
          : {}),
      },
      localization: timeKind === "intraday" ? { timeFormatter: (t: UTCTimestamp) => formatIntradayTime(t) } : {},
    });
    chartRef.current = chart;

    const mainScaleMargins = volume && volume.length > 0 ? { top: 0.1, bottom: 0.25 } : { top: 0.1, bottom: 0.1 };

    if (type === "candles") {
      mainSeriesRef.current = chart.addSeries(CandlestickSeries, {
        upColor: UP_COLOR,
        downColor: DOWN_COLOR,
        borderVisible: false,
        wickUpColor: UP_COLOR,
        wickDownColor: DOWN_COLOR,
        priceScaleId: "right",
      });
    } else if (type === "line") {
      mainSeriesRef.current = chart.addSeries(LineSeries, { color: UP_COLOR, lineWidth: 2, priceScaleId: "right" });
    } else {
      mainSeriesRef.current = chart.addSeries(AreaSeries, {
        lineColor: UP_COLOR,
        topColor: "rgba(16, 185, 129, 0.25)",
        bottomColor: "rgba(16, 185, 129, 0.02)",
        lineWidth: 2,
        priceScaleId: "right",
      });
    }
    mainSeriesRef.current.priceScale().applyOptions({ scaleMargins: mainScaleMargins });

    if (volume && volume.length >= 0) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volumeSeriesRef.current = volumeSeries;
    } else {
      volumeSeriesRef.current = null;
    }

    overlaySeriesRef.current = (overlays ?? []).map(series => {
      const overlay = chart.addSeries(LineSeries, {
        color: series.color,
        lineWidth: 1,
        lineStyle: LineStyle.Solid,
        priceLineVisible: false,
        lastValueVisible: false,
        priceScaleId: "right",
      });
      return overlay;
    });

    const onCrosshair = (param: MouseEventParams) => {
      const data = dataRef.current;
      if (!param.time) {
        setLegend(legendFromLast(data));
        return;
      }
      const atCrosshair = (time: number | string) => toTime(time, timeKind) === param.time;
      const candle = data.candles.find(point => atCrosshair(point.time));
      const linePoint = data.line.find(point => atCrosshair(point.time));
      const volumePoint = data.volume.find(point => atCrosshair(point.time));
      setLegend({
        open: candle?.open,
        high: candle?.high,
        low: candle?.low,
        close: candle?.close,
        value: candle?.close ?? linePoint?.value,
        volume: volumePoint?.value,
        overlays: data.overlays.map(series => {
          const match = series.points.find(point => atCrosshair(point.time));
          return { label: series.label, color: series.color, value: match?.value ?? Number.NaN };
        }),
      });
    };
    chart.subscribeCrosshairMove(onCrosshair);

    return () => {
      chart.unsubscribeCrosshairMove(onCrosshair);
      chart.remove();
      chartRef.current = null;
      mainSeriesRef.current = null;
      volumeSeriesRef.current = null;
      overlaySeriesRef.current = [];
    };
    // `type`, `timeKind` and the PRESENCE of volume/overlays are structural;
    // the data effects below update contents in place.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, timeKind, volume != null, overlays?.length ?? 0]);

  // Data contents.
  useEffect(() => {
    const chart = chartRef.current;
    const main = mainSeriesRef.current;
    if (!chart || !main) return;
    const data = structured;

    if (type === "candles") {
      main.setData(data.candles.map(point => ({ time: toTime(point.time, timeKind), open: point.open, high: point.high, low: point.low, close: point.close })));
    } else {
      main.setData(data.line.map(point => ({ time: toTime(point.time, timeKind), value: point.value })));
    }

    volumeSeriesRef.current?.setData(
      data.volume.map(point => ({ time: toTime(point.time, timeKind), value: point.value, color: point.up ? VOLUME_UP : VOLUME_DOWN })),
    );

    overlaySeriesRef.current.forEach((series, i) => {
      const points = data.overlays[i]?.points ?? [];
      series.setData(points.map(point => ({ time: toTime(point.time, timeKind), value: point.value })));
    });

    chart.timeScale().fitContent();
    setLegend(legendFromLast(data));
  }, [structured, type, timeKind]);

  // Log scale toggles in place.
  useEffect(() => {
    chartRef.current?.priceScale("right").applyOptions({ mode: logScale ? PriceScaleMode.Logarithmic : PriceScaleMode.Normal });
  }, [logScale]);

  return (
    <div className={className}>
      {showLegend && (
        <ChartLegend
          legend={legend}
          hasCandles={type === "candles"}
          overlayLabels={structured.overlays.map(series => series.label)}
          overlayColors={structured.overlays.map(series => series.color)}
        />
      )}
      <div ref={containerRef} style={{ height }} className="w-full" data-testid="price-chart" />
    </div>
  );
}

function legendFromLast(data: { candles: CandlePoint[]; line: LinePoint[]; volume: VolumePoint[]; overlays: OverlaySeries[] }): LegendState {
  const candle = data.candles[data.candles.length - 1];
  const linePoint = data.line[data.line.length - 1];
  return {
    open: candle?.open,
    high: candle?.high,
    low: candle?.low,
    close: candle?.close,
    value: candle?.close ?? linePoint?.value,
    volume: data.volume[data.volume.length - 1]?.value,
    overlays: data.overlays.map(series => ({
      label: series.label,
      color: series.color,
      value: series.points[series.points.length - 1]?.value ?? Number.NaN,
    })),
  };
}

function ChartLegend({
  legend,
  hasCandles,
  overlayLabels,
  overlayColors,
}: {
  legend: LegendState | null;
  hasCandles: boolean;
  overlayLabels: string[];
  overlayColors: string[];
}) {
  if (!legend || (legend.value == null && legend.close == null)) return null;
  const up = (legend.close ?? legend.value ?? 0) >= (legend.open ?? 0);
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 px-1 pb-1 text-[11px] font-mono text-muted" data-testid="chart-legend">
      {hasCandles && legend.open != null ? (
        <>
          <span>
            O <span className={up ? "text-emerald-500" : "text-red-500"}>{fmtPrice(legend.open)}</span>
          </span>
          <span>
            H <span className={up ? "text-emerald-500" : "text-red-500"}>{fmtPrice(legend.high)}</span>
          </span>
          <span>
            L <span className={up ? "text-emerald-500" : "text-red-500"}>{fmtPrice(legend.low)}</span>
          </span>
          <span>
            C <span className={up ? "text-emerald-500" : "text-red-500"}>{fmtPrice(legend.close)}</span>
          </span>
        </>
      ) : (
        <span>
          <span className={up ? "text-emerald-500" : "text-red-500"}>{fmtPrice(legend.value)}</span>
        </span>
      )}
      {legend.volume != null && <span>Vol {fmtVol(legend.volume)}</span>}
      {overlayLabels.map((label, i) => (
        <span key={label} style={{ color: overlayColors[i] }}>
          {label} {fmtPrice(legend.overlays[i]?.value)}
        </span>
      ))}
    </div>
  );
}
