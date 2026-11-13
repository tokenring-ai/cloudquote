import ChangeIndicator from "@tokenring-ai/one-frontend/components/ui/ChangeIndicator.tsx";
import EmptyState from "@tokenring-ai/one-frontend/components/ui/EmptyState.tsx";
import ListItemWithActions from "@tokenring-ai/one-frontend/components/ui/ListItemWithActions.tsx";
import LoadingState from "@tokenring-ai/one-frontend/components/ui/LoadingState.tsx";
import SectionLabel from "@tokenring-ai/one-frontend/components/ui/SectionLabel.tsx";
import ViewHeader from "@tokenring-ai/one-frontend/components/ui/ViewHeader.tsx";
import ViewShell from "@tokenring-ai/one-frontend/components/ui/ViewShell.tsx";
import { useLiveStreamStatusFromSWR } from "@tokenring-ai/one-frontend/hooks/useLiveStreamStatus.ts";
import { useStockLeaders, useStockQuotesStream } from "@tokenring-ai/one-frontend/rpc.ts";
import { Star, TrendingDown, TrendingUp, X, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import StocksLoadError from "../features/stocks/components/StocksLoadError.tsx";
import SymbolSearchBox from "../features/stocks/components/SymbolSearchBox.tsx";
import { fmt, fmtPrice, fmtVol } from "../features/stocks/formatters.ts";
import type { StockQuote } from "../features/stocks/types.ts";
import { useWatchlist } from "../features/stocks/watchlist.ts";
import { STOCKS_GRADIENT } from "../ids.ts";
import { useStocksLayoutNavigation } from "../lib/useStocksLayoutNavigation.ts";

const MOVERS_TABS = [
  { key: "PERCENTGAINERS", label: "Gainers" },
  { key: "PERCENTLOSERS", label: "Losers" },
  { key: "MOSTACTIVE", label: "Active" },
] as const;

type MoversTab = (typeof MOVERS_TABS)[number]["key"];

/**
 * The Stocks dashboard's left rail: symbol search, the user's watchlist (live
 * via the shared quote stream) and the market movers boards. Rows open the
 * symbol's market panel in the main area; elsewhere they navigate to Stocks.
 */
export default function StocksNavigatorPane() {
  const { openSymbol } = useStocksLayoutNavigation();
  const [inputValue, setInputValue] = useState("");
  const [moversTab, setMoversTab] = useState<MoversTab>("MOSTACTIVE");
  const [securityType, setSecurityType] = useState<"STOCK" | "ETF" | null>(null);

  const watchlist = useWatchlist();
  const watchQuotes = useStockQuotesStream(watchlist.symbols);
  const watchStatus = useLiveStreamStatusFromSWR(watchQuotes);
  const movers = useStockLeaders(moversTab, 12, securityType ? { type: securityType } : undefined);

  const watchRows = useMemo(() => {
    const bySymbol = new Map<string, StockQuote>();
    for (const row of watchQuotes.data?.rows ?? []) {
      if (row.Symbol) bySymbol.set(row.Symbol.toUpperCase(), row);
    }
    return watchlist.symbols.map(symbol => ({ symbol, quote: bySymbol.get(symbol) }));
  }, [watchQuotes.data, watchlist.symbols]);

  const pick = (symbol: string) => openSymbol(symbol.toUpperCase());

  return (
    <ViewShell
      tone="sidebar"
      scroll={false}
      header={
        <ViewHeader
          variant="navigator"
          icon={TrendingUp}
          iconGradient={STOCKS_GRADIENT}
          title="Stocks"
          subtitle={watchStatus.isStale ? undefined : "Search · watchlist · movers"}
        />
      }
    >
      <div className="flex-1 min-h-0 overflow-y-auto" data-testid="stocks-navigator">
        <div className="p-2 border-b border-primary">
          <SymbolSearchBox value={inputValue} onChange={setInputValue} onSelect={pick} />
        </div>

        <div className="p-2">
          <div className="flex items-center justify-between px-1 mb-1.5">
            <SectionLabel className="mb-0">Watchlist</SectionLabel>
            <LiveDot status={watchStatus.status} />
          </div>
          {watchlist.symbols.length === 0 ? (
            <p className="px-1 py-2 text-xs text-muted">Star a symbol to pin it here.</p>
          ) : watchQuotes.isLoading && !watchQuotes.data ? (
            <LoadingState size="sm" className="py-4" />
          ) : (
            <ul className="divide-y divide-primary/60" aria-label="Watchlist">
              {watchRows.map(({ symbol, quote }) => (
                <li key={symbol}>
                  <ListItemWithActions
                    id={symbol}
                    onPrimary={() => pick(symbol)}
                    primaryProps={{ title: `Open ${symbol}`, "aria-label": `Open ${symbol}` }}
                    className="gap-2 px-2 py-1.5 rounded-lg"
                    action={
                      <button
                        type="button"
                        onClick={() => watchlist.remove(symbol)}
                        className="p-1 rounded-md text-muted hover:text-red-500 hover:bg-hover transition-colors cursor-pointer focus-ring"
                        aria-label={`Remove ${symbol} from watchlist`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    }
                  >
                    <Star className="w-3 h-3 text-amber-400 shrink-0" aria-hidden="true" />
                    <span className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
                      <span className="text-xs font-bold text-accent-soft">{symbol}</span>
                      {quote?.Price != null ? (
                        <span className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-primary font-mono">${fmtPrice(quote.Price)}</span>
                          <ChangeIndicator
                            change={quote.ChangePercent}
                            showIcon={false}
                            formatChange={v => `${fmt(v)}%`}
                            className="text-[11px] font-medium"
                            align="right"
                          />
                        </span>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </span>
                  </ListItemWithActions>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="p-2 border-t border-primary">
          <div className="flex items-center justify-between gap-2 px-1 mb-1.5">
            <SectionLabel className="mb-0">Market movers</SectionLabel>
            <div className="flex gap-0.5">
              {(["STOCK", "ETF"] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSecurityType(current => (current === type ? null : type))}
                  aria-pressed={securityType === type}
                  className={`px-1.5 py-0.5 text-[10px] font-semibold rounded-md border transition-colors cursor-pointer focus-ring ${
                    securityType === type ? "bg-accent text-white border-accent" : "border-primary text-muted hover:text-primary"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-1 px-1 mb-2">
            {MOVERS_TABS.map(tab => {
              const active = moversTab === tab.key;
              const Icon = tab.key === "PERCENTGAINERS" ? TrendingUp : tab.key === "PERCENTLOSERS" ? TrendingDown : Zap;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setMoversTab(tab.key)}
                  className={`flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer focus-ring border ${
                    active ? "bg-accent text-white border-accent" : "bg-secondary text-muted hover:text-primary border-primary"
                  }`}
                >
                  <Icon className="w-3 h-3" /> {tab.label}
                </button>
              );
            })}
          </div>

          {movers.isLoading && !movers.data ? (
            <LoadingState size="sm" className="py-4" />
          ) : movers.error ? (
            <StocksLoadError title="Failed to load movers" error={movers.error} onRetry={() => void movers.mutate()} compact />
          ) : (movers.data?.rows ?? []).filter(Boolean).length === 0 ? (
            <EmptyState icon={Zap} title="No matches" hint="Loosen the filters to see more." variant="page" className="py-4" />
          ) : (
            <ul className="divide-y divide-primary/60" aria-label="Market movers">
              {(movers.data?.rows ?? []).map((row, i) => {
                if (!row.Symbol) return null;
                const sym = row.Symbol.toUpperCase();
                return (
                  <li key={`${sym}-${i}`}>
                    <ListItemWithActions
                      id={sym}
                      onPrimary={() => pick(sym)}
                      primaryProps={{ title: `Open ${sym}`, "aria-label": `Open ${sym}` }}
                      className="gap-2 px-2 py-1.5 rounded-lg"
                      data-testid={`mover-row-${sym}`}
                    >
                      <span className="min-w-0 flex-1 flex items-baseline justify-between gap-2">
                        <span className="min-w-0">
                          <span className="block text-xs font-bold text-accent-soft">{sym}</span>
                          <span className="block text-[11px] text-muted truncate">{row.Name ?? ""}</span>
                        </span>
                        <span className="flex flex-col items-end shrink-0">
                          <span className="text-xs text-primary font-mono">${fmtPrice(row.Price)}</span>
                          <ChangeIndicator
                            change={row.ChangePercent}
                            showIcon={false}
                            formatChange={v => `${fmt(v)}%`}
                            className="text-[11px] font-medium"
                            align="right"
                          />
                          <span className="text-[10px] text-muted">{fmtVol(row.Volume)}</span>
                        </span>
                      </span>
                    </ListItemWithActions>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </ViewShell>
  );
}

function LiveDot({ status }: { status: string }) {
  if (status === "error") return <span className="text-[10px] font-semibold text-red-400">OFFLINE</span>;
  if (status === "reconnecting" || status === "connecting") return <span className="text-[10px] font-semibold text-amber-400 animate-pulse">…</span>;
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500" data-testid="watchlist-live">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" /> LIVE
    </span>
  );
}
