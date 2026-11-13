import ErrorState from "@tokenring-ai/one-frontend/components/ui/ErrorState.tsx";
import { useStockPriceHistory, useStockPriceTicks } from "@tokenring-ai/one-frontend/rpc.ts";
import { memo, useMemo, useState } from "react";
import { useStocksLayoutNavigation } from "../../../lib/useStocksLayoutNavigation.ts";
import type { CandlePoint, LinePoint, VolumePoint } from "../charts/chartData.ts";
import { historyToCandles, historyToLine, historyToVolume, ticksToBucketedCandles, ticksToLine, ticksToVolumeBars } from "../charts/chartData.ts";
import { type OverlaySeries, sma } from "../charts/indicators.ts";
import PriceChart, { type ChartType } from "../charts/PriceChart.tsx";
import { fmtPrice } from "../formatters.ts";
import { DEFAULT_INTERVAL, INTERVALS, intervalByKey, intervalHistoryRange } from "../intervals.ts";

export interface LayoutPriceChartCardProps {
  symbol: string;
  /** Chart height in px. */
  height?: number;
  defaultType?: ChartType;
  defaultInterval?: string;
  /** Candle/line/area switcher. Default true. */
  showTypeToggle?: boolean;
  /** Log-scale toggle. Default true. */
  showLogToggle?: boolean;
  /** Interval picker. Default true. */
  showIntervalPicker?: boolean;
}

const TYPE_OPTIONS: { key: ChartType; label: string }[] = [
  { key: "line", label: "Line" },
  { key: "area", label: "Area" },
  { key: "candles", label: "Candles" },
];

const chip = (active: boolean) =>
  `px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors cursor-pointer focus-ring border ${
    active ? "bg-accent text-white border-accent" : "bg-secondary text-muted hover:text-primary border-primary"
  }`;

/**
 * Interactive price chart with interval picker, volume pane and moving-average
 * overlays. Owns its interval/type state and the tick/history data fetching —
 * the shared chart block of the Market and Chart views.
 */
const LayoutPriceChartCard = memo(function LayoutPriceChartCard({
  symbol,
  height = 300,
  defaultType = "area",
  defaultInterval = DEFAULT_INTERVAL,
  showTypeToggle = true,
  showLogToggle = true,
  showIntervalPicker = true,
}: LayoutPriceChartCardProps) {
  const { openSymbol } = useStocksLayoutNavigation();
  const [intervalKey, setIntervalKey] = useState(defaultInterval);
  const [type, setType] = useState<ChartType>(defaultType);
  const [logScale, setLogScale] = useState(false);
  const [showVolume, setShowVolume] = useState(true);
  const [showMa, setShowMa] = useState(true);

  const interval = intervalByKey(intervalKey);
  const useTicks = interval.kind === "ticks";
  const range = useMemo(() => intervalHistoryRange(interval), [interval]);
  const ticks = useStockPriceTicks(useTicks ? symbol : undefined);
  const history = useStockPriceHistory(useTicks ? undefined : symbol, range.from, range.to);

  const data = useMemo(() => {
    if (useTicks) {
      const rows = (ticks.data?.rows ?? []) as [number, number, number][];
      const capped = interval.maxTicks && rows.length > interval.maxTicks ? rows.slice(-interval.maxTicks) : rows;
      const candles: CandlePoint[] = type === "candles" ? ticksToBucketedCandles(capped) : [];
      const line: LinePoint[] = type === "candles" ? [] : ticksToLine(capped);
      const volume: VolumePoint[] = showVolume ? ticksToVolumeBars(capped) : [];
      return { candles, line, volume, timeKind: "intraday" as const, source: ticks };
    }
    const rows = history.data?.rows ?? [];
    const candles: CandlePoint[] = type === "candles" ? historyToCandles(rows) : [];
    const line: LinePoint[] = type === "candles" ? [] : historyToLine(rows);
    const volume: VolumePoint[] = showVolume ? historyToVolume(rows) : [];
    return { candles, line, volume, timeKind: "date" as const, source: history };
  }, [useTicks, ticks.data, history.data, type, showVolume, interval.maxTicks]);

  // Moving averages only make sense on daily closes and need enough sessions.
  const overlays = useMemo<OverlaySeries[]>(() => {
    if (!showMa || useTicks) return [];
    const closes = historyToLine(history.data?.rows ?? []);
    const overlays: OverlaySeries[] = [];
    for (const period of [50, 200]) {
      const points = sma(closes, period);
      if (points.length > 0) overlays.push({ label: `SMA ${period}`, color: period === 50 ? "#6366f1" : "#f59e0b", points });
    }
    return overlays;
  }, [showMa, useTicks, history.data]);

  const loading = useTicks ? ticks.isLoading : history.isLoading;
  const error = useTicks ? ticks.error : history.error;
  const hasData = data.candles.length > 0 || data.line.length > 0;
  const source = data.source;

  // A local draft: navigating on every keystroke opened a symbol per letter typed.
  const [symbolDraft, setSymbolDraft] = useState("");
  const switchSymbol = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    const value = symbolDraft.trim().toUpperCase();
    if (!value) return;
    setSymbolDraft("");
    openSymbol(value);
  };

  return (
    <div className="bg-secondary rounded-xl border border-primary p-3 space-y-2" data-testid="price-chart-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        {showIntervalPicker && (
          <div className="flex gap-1">
            {INTERVALS.map(def => (
              <button key={def.key} type="button" onClick={() => setIntervalKey(def.key)} className={chip(intervalKey === def.key)}>
                {def.label}
              </button>
            ))}
          </div>
        )}
        {showTypeToggle && (
          <div className="flex gap-1">
            {TYPE_OPTIONS.map(option => (
              <button key={option.key} type="button" onClick={() => setType(option.key)} className={chip(type === option.key)}>
                {option.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-1">
          <button type="button" onClick={() => setShowVolume(value => !value)} className={chip(showVolume)} aria-pressed={showVolume}>
            Vol
          </button>
          {!useTicks && (
            <button type="button" onClick={() => setShowMa(value => !value)} className={chip(showMa)} aria-pressed={showMa}>
              SMA
            </button>
          )}
          {showLogToggle && (
            <button type="button" onClick={() => setLogScale(value => !value)} className={chip(logScale)} aria-pressed={logScale}>
              Log
            </button>
          )}
        </div>
        <form onSubmit={switchSymbol} className="ml-auto flex items-center gap-2 text-xs text-muted">
          <span className="hidden sm:inline">{symbol}</span>
          <input
            value={symbolDraft}
            onChange={event => setSymbolDraft(event.target.value.toUpperCase())}
            placeholder="Switch symbol…"
            aria-label="Switch symbol"
            className="w-28 px-2 py-0.5 bg-primary border border-primary rounded-md text-xs text-primary placeholder:text-muted focus:border-accent outline-none"
          />
        </form>
      </div>

      {loading && !hasData ? (
        <div className="flex justify-center items-center" style={{ height }}>
          <Loader />
        </div>
      ) : error && !hasData ? (
        <ErrorState error={error} title={`Failed to load chart data for ${symbol}`} onRetry={() => void source.mutate()} variant="page" className="py-6" />
      ) : !hasData ? (
        <div className="flex justify-center items-center text-sm text-muted" style={{ height }}>
          No chart data for {symbol}
        </div>
      ) : (
        <PriceChart
          type={type}
          candles={data.candles}
          line={data.line}
          volume={data.volume}
          overlays={overlays}
          timeKind={data.timeKind}
          logScale={logScale}
          height={height}
        />
      )}

      {!loading && hasData && <LastCloseNote candles={data.candles} line={data.line} />}
    </div>
  );
});

export default LayoutPriceChartCard;

function LastCloseNote({ candles, line }: { candles: CandlePoint[]; line: LinePoint[] }) {
  const last = candles[candles.length - 1] ?? line[line.length - 1];
  if (!last) return null;
  const close = "close" in last ? last.close : last.value;
  return <p className="text-[11px] text-muted px-1">Last close ${fmtPrice(close)}</p>;
}

function Loader() {
  return (
    <svg className="w-5 h-5 animate-spin text-muted" viewBox="0 0 24 24" fill="none" aria-label="Loading">
      <title>Loading</title>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4z" />
    </svg>
  );
}
