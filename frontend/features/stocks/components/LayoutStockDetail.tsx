import ChangeIndicator from "@tokenring-ai/one-frontend/components/ui/ChangeIndicator.tsx";
import StatusBadge from "@tokenring-ai/one-frontend/components/ui/StatusBadge.tsx";
import { useLiveStreamStatusFromSWR } from "@tokenring-ai/one-frontend/hooks/useLiveStreamStatus.ts";
import { useStockQuotesStream } from "@tokenring-ai/one-frontend/rpc.ts";
import { BotMessageSquare, CandlestickChart, Clock, History, Loader2, Newspaper, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { fmt, fmtPrice } from "../formatters.ts";
import { useWatchlist } from "../watchlist.ts";
import AskAIModal from "./AskAIModal.tsx";
import LastTradeTime from "./LastTradeTime.tsx";
import LayoutPriceChartCard from "./LayoutPriceChartCard.tsx";
import OverviewTab from "./OverviewTab.tsx";

interface LayoutStockDetailProps {
  symbol: string;
  onClear: () => void;
  /** Opens one of the per-symbol tool views (chart, news, history) in the main area. */
  onOpenTool: (viewId: string, symbol: string) => void;
  chartViewId: string;
  newsViewId: string;
  historyViewId: string;
}

/**
 * The symbol workspace: live quote header, the interactive price chart, and
 * the overview sections (ranges, key stats, performance). The advanced chart,
 * news and history live in their own dock views — the header buttons open them
 * beside this panel.
 */
export default function LayoutStockDetail({ symbol, onClear, onOpenTool, chartViewId, newsViewId, historyViewId }: LayoutStockDetailProps) {
  const [showAskAI, setShowAskAI] = useState(false);
  const watchlist = useWatchlist();

  const quotes = useStockQuotesStream([symbol]);
  const live = useLiveStreamStatusFromSWR(quotes);
  const quoteRow = quotes.data?.rows[0];

  const watched = watchlist.isWatched(symbol);
  const tools = useMemo(
    () => [
      { viewId: chartViewId, label: "Chart", icon: <CandlestickChart className="w-3.5 h-3.5" /> },
      { viewId: newsViewId, label: "News", icon: <Newspaper className="w-3.5 h-3.5" /> },
      { viewId: historyViewId, label: "History", icon: <History className="w-3.5 h-3.5" /> },
    ],
    [chartViewId, historyViewId, newsViewId],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 px-4 py-4 bg-secondary border border-primary rounded-2xl">
        <div className="flex items-start gap-3 min-w-0">
          {(() => {
            const logo =
              (quoteRow as { CLLogoBright128?: string } | null)?.CLLogoBright128 ?? (quoteRow as { CLIconBright128?: string } | null)?.CLIconBright128;
            if (!logo) return null;
            return (
              <div className="w-12 h-12 rounded-lg bg-primary border border-primary flex items-center justify-center overflow-hidden shrink-0">
                <img src={logo} alt={`${symbol} logo`} className="w-full h-full object-contain p-1" />
              </div>
            );
          })()}
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="text-lg font-bold text-accent-soft">{symbol}</span>
              {(quoteRow?.Name ?? symbol) !== symbol && <span className="text-sm text-secondary truncate">{quoteRow?.Name}</span>}
              {quoteRow?.ExchangeShortName && (
                <span className="text-xs px-1.5 py-0.5 bg-primary border border-primary rounded text-muted">{quoteRow.ExchangeShortName}</span>
              )}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              {quotes.isLoading && !quoteRow ? (
                <Loader2 className="w-4 h-4 animate-spin text-muted" />
              ) : quotes.error && !quoteRow ? (
                <span className="flex items-center gap-2 text-sm text-red-400">
                  Failed to load quote
                  <button
                    type="button"
                    onClick={() => void quotes.mutate()}
                    className="text-xs text-accent hover:text-accent-soft transition-colors cursor-pointer focus-ring"
                  >
                    Retry
                  </button>
                </span>
              ) : quoteRow?.Price != null ? (
                <>
                  <span className="text-3xl font-bold text-primary">${fmtPrice(quoteRow.Price)}</span>
                  <ChangeIndicator
                    change={quoteRow.Change}
                    changePercent={quoteRow.ChangePercent}
                    formatChange={fmt}
                    formatPercent={fmt}
                    className="text-sm font-medium"
                  />
                  {quoteRow.LastTradeTime && (
                    <span className="text-xs text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" /> <LastTradeTime ts={quoteRow.LastTradeTime} delay={quoteRow.Delay} exchangeDelay={quoteRow.ExchangeDelay} />
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-muted">Price unavailable</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => watchlist.toggle(symbol)}
              aria-pressed={watched}
              aria-label={watched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
              className={`p-2 rounded-lg border transition-colors cursor-pointer focus-ring ${
                watched ? "text-amber-400 border-amber-400/40 bg-amber-400/10" : "text-muted hover:text-primary border-primary bg-secondary"
              }`}
            >
              <Star className={`w-4 h-4 ${watched ? "fill-current" : ""}`} />
            </button>
            <button
              type="button"
              onClick={() => setShowAskAI(true)}
              className="flex items-center gap-1.5 px-3 py-2 btn-accent text-xs font-medium rounded-lg transition-colors cursor-pointer focus-ring"
            >
              <BotMessageSquare className="w-3.5 h-3.5" />
              Ask AI
            </button>
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-2 text-xs text-muted hover:text-primary bg-secondary border border-primary rounded-lg transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            {tools.map(tool => (
              <button
                key={tool.viewId}
                type="button"
                onClick={() => onOpenTool(tool.viewId, symbol)}
                className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-muted hover:text-primary bg-secondary border border-primary rounded-md transition-colors cursor-pointer focus-ring"
                title={`Open ${symbol} ${tool.label.toLowerCase()} beside this panel`}
              >
                {tool.icon} {tool.label}
              </button>
            ))}
          </div>
          <StatusBadge {...liveBadge(live.status)} variant="pill" />
        </div>
      </div>

      <LayoutPriceChartCard symbol={symbol} height={280} />

      <OverviewTab quote={quoteRow} quoteLoading={quotes.isLoading} quoteError={quotes.error} onRetry={() => void quotes.mutate()} />

      {showAskAI && <AskAIModal symbol={symbol} quoteData={quoteRow} onClose={() => setShowAskAI(false)} />}
    </div>
  );
}

function liveBadge(status: string): { label: string; dotColor: string; pulse?: boolean; colorClass: string } {
  if (status === "live") return { label: "Live", dotColor: "bg-emerald-500", pulse: true, colorClass: "text-emerald-500" };
  if (status === "reconnecting") return { label: "Reconnecting", dotColor: "bg-amber-500", colorClass: "text-amber-500" };
  if (status === "connecting") return { label: "Connecting", dotColor: "bg-amber-500", pulse: true, colorClass: "text-amber-500" };
  return { label: "Offline", dotColor: "bg-red-500", colorClass: "text-red-500" };
}
