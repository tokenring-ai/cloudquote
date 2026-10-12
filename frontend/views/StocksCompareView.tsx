import EmptyState from "@tokenring-ai/one-frontend/components/ui/EmptyState.tsx";
import ViewHeader from "@tokenring-ai/one-frontend/components/ui/ViewHeader.tsx";
import ViewShell from "@tokenring-ai/one-frontend/components/ui/ViewShell.tsx";
import type { ViewProps } from "@tokenring-ai/one-frontend/dock/types.ts";
import { useStockPriceHistory } from "@tokenring-ai/one-frontend/rpc.ts";
import { GitCompareArrows, Plus, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { historyToLine, type LinePoint } from "../features/stocks/charts/chartData.ts";
import { normalizedPerformance, periodReturn } from "../features/stocks/charts/compare.ts";
import PriceChart from "../features/stocks/charts/PriceChart.tsx";
import { fmt, historyRange } from "../features/stocks/formatters.ts";
import { useWatchlist } from "../features/stocks/watchlist.ts";
import { type CompareParams, MAX_COMPARE_SYMBOLS, normalizeSymbol, normalizeSymbols } from "../lib/stocksShared.ts";
import { STOCKS_DASHBOARD_ID } from "../manifest.ts";

const MAX_COMPARE = MAX_COMPARE_SYMBOLS;
const SERIES_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#06b6d4"];
const PERIODS = [
  { label: "1W", days: 7 },
  { label: "1M", days: 30 },
  { label: "3M", days: 91 },
  { label: "6M", days: 182 },
];

function useSymbolCloses(symbol: string | undefined) {
  const range = useMemo(() => historyRange(6), []);
  const history = useStockPriceHistory(symbol, range.from, range.to);
  const points = useMemo<LinePoint[]>(() => historyToLine(history.data?.rows ?? []), [history.data]);
  return { points, isLoading: history.isLoading, error: history.error };
}

/**
 * Normalized performance comparison of up to four symbols: one chart where
 * every series is rebased to 0% at the first shared session, plus a trailing
 * returns table. Seeded from params (the screener hands a selection over) and
 * editable via the chip picker.
 */
export default function StocksCompareView({ params, panel }: ViewProps<CompareParams>) {
  const watchlist = useWatchlist();
  const [draft, setDraft] = useState("");

  // One list: initialised from the panel params, every edit written back to
  // them (so the layout persists it), and replaced when the params change from
  // outside — "Compare selected" updates the open panel in place.
  const paramsKey = JSON.stringify(normalizeSymbols(params.symbols ?? []));
  const [seenParamsKey, setSeenParamsKey] = useState(paramsKey);
  const [symbols, setSymbolsState] = useState<string[]>(() => normalizeSymbols(params.symbols ?? []));
  if (seenParamsKey !== paramsKey) {
    setSeenParamsKey(paramsKey);
    setSymbolsState(normalizeSymbols(params.symbols ?? []));
  }

  const setSymbols = useCallback(
    (next: string[]) => {
      const normalized = normalizeSymbols(next).slice(0, MAX_COMPARE);
      setSymbolsState(normalized);
      // `symbols` must be non-empty when present.
      panel.updateParams({ symbols: normalized.length > 0 ? normalized : undefined });
    },
    [panel],
  );

  const s1 = useSymbolCloses(symbols[0]);
  const s2 = useSymbolCloses(symbols[1]);
  const s3 = useSymbolCloses(symbols[2]);
  const s4 = useSymbolCloses(symbols[3]);

  const loaded = useMemo(
    () => [s1, s2, s3, s4].map((series, i) => ({ symbol: symbols[i]!, ...series })).filter(series => Boolean(series.symbol)),
    [symbols, s1, s2, s3, s4],
  );

  const series = useMemo(() => normalizedPerformance(loaded), [loaded]);
  const isLoading = loaded.length > 0 && loaded.every(entry => entry.isLoading);
  const returns = useMemo(
    () =>
      loaded.map(entry => ({
        symbol: entry.symbol,
        returns: PERIODS.map(period => ({ label: period.label, pct: periodReturn(entry.points, period.days) })),
        total: entry.points.length > 1 ? ((entry.points[entry.points.length - 1]!.value - entry.points[0]!.value) / entry.points[0]!.value) * 100 : null,
      })),
    [loaded],
  );

  const addSymbol = (raw: string) => {
    const upper = normalizeSymbol(raw);
    if (!upper || symbols.includes(upper) || symbols.length >= MAX_COMPARE) return;
    setSymbols([...symbols, upper]);
    setDraft("");
  };

  const removeSymbol = (symbol: string) => setSymbols(symbols.filter(s => s !== symbol));

  const seedFromWatchlist = () => setSymbols(watchlist.symbols);

  return (
    <ViewShell header={<ViewHeader variant="panel" dashboardId={STOCKS_DASHBOARD_ID} title="Compare" subtitle="Normalized % performance, up to 4 symbols" />}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {symbols.map((symbol, i) => (
            <span
              key={symbol}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-primary bg-secondary text-xs font-bold"
              style={{ color: SERIES_COLORS[i % SERIES_COLORS.length] }}
            >
              {symbol}
              <button
                type="button"
                onClick={() => removeSymbol(symbol)}
                aria-label={`Remove ${symbol}`}
                className="text-muted hover:text-primary cursor-pointer focus-ring rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {symbols.length < MAX_COMPARE && (
            <form
              onSubmit={event => {
                event.preventDefault();
                addSymbol(draft);
              }}
              className="flex items-center gap-1"
            >
              <input
                value={draft}
                onChange={event => setDraft(event.target.value.toUpperCase())}
                placeholder="Add symbol…"
                aria-label="Add symbol to compare"
                className="w-28 px-2 py-1 bg-secondary border border-primary rounded-lg text-xs text-primary placeholder:text-muted focus:border-accent outline-none"
              />
              <button type="submit" className="p-1.5 text-muted hover:text-primary cursor-pointer focus-ring rounded" aria-label="Add symbol">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
          <button
            type="button"
            onClick={seedFromWatchlist}
            disabled={symbols.length >= MAX_COMPARE}
            className="px-2 py-1 text-[11px] text-muted hover:text-primary border border-primary rounded-lg transition-colors cursor-pointer focus-ring disabled:opacity-40"
          >
            Use watchlist
          </button>
        </div>

        {symbols.length === 0 ? (
          <EmptyState
            icon={GitCompareArrows}
            title="Pick symbols to compare"
            hint="Add up to four tickers, or let the screener hand a selection over."
            variant="page"
            className="py-10"
          />
        ) : isLoading ? (
          <div className="py-16 text-center text-sm text-muted">Loading price history…</div>
        ) : series.length === 0 ? (
          <EmptyState
            icon={GitCompareArrows}
            title="No comparable history"
            hint="The selected symbols share no trading sessions in the loaded window."
            variant="page"
            className="py-10"
          />
        ) : (
          <>
            <div className="bg-secondary rounded-xl border border-primary p-3" data-testid="stocks-compare-chart">
              <PriceChart
                type="line"
                line={series[0]!.points}
                overlays={series
                  .slice(1)
                  .map((entry, i) => ({ label: entry.symbol, color: SERIES_COLORS[(i + 1) % SERIES_COLORS.length]!, points: entry.points }))}
                timeKind="date"
                height={320}
              />
              <div className="flex flex-wrap gap-3 px-1 pt-1 text-[11px] font-mono">
                {series.map((entry, i) => (
                  <span key={entry.symbol} style={{ color: SERIES_COLORS[i % SERIES_COLORS.length] }}>
                    {entry.symbol}
                    {entry.totalReturn != null ? ` ${entry.totalReturn >= 0 ? "+" : ""}${fmt(entry.totalReturn)}%` : ""}
                  </span>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-primary">
              <table className="w-full text-xs" data-testid="stocks-compare-returns">
                <thead>
                  <tr className="bg-secondary border-b border-primary">
                    <th className="px-3 py-2 text-left font-semibold text-muted">Symbol</th>
                    {PERIODS.map(period => (
                      <th key={period.label} className="px-3 py-2 text-right font-semibold text-muted">
                        {period.label}
                      </th>
                    ))}
                    {/* Not "6M": that column is already the trailing 182-day return; this one spans the whole loaded range. */}
                    <th className="px-3 py-2 text-right font-semibold text-muted" title="Return from the first to the last loaded session">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {returns.map(entry => (
                    <tr key={entry.symbol} className="border-b border-primary/50 last:border-0">
                      <td className="px-3 py-2 font-bold text-accent-soft">{entry.symbol}</td>
                      {entry.returns.map(ret => (
                        <td key={ret.label} className={`px-3 py-2 text-right font-mono ${(ret.pct ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                          {ret.pct != null ? `${ret.pct >= 0 ? "+" : ""}${fmt(ret.pct)}%` : "—"}
                        </td>
                      ))}
                      <td className={`px-3 py-2 text-right font-mono font-semibold ${(entry.total ?? 0) >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {entry.total != null ? `${entry.total >= 0 ? "+" : ""}${fmt(entry.total)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </ViewShell>
  );
}
