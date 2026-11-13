import { useRouteParamsFor } from "@tokenring-ai/one-frontend/apps/panelHooks.ts";
import ViewHeader from "@tokenring-ai/one-frontend/components/ui/ViewHeader.tsx";
import ViewShell from "@tokenring-ai/one-frontend/components/ui/ViewShell.tsx";
import type { ViewProps } from "@tokenring-ai/one-frontend/layout/define.ts";
import { usePanel } from "@tokenring-ai/one-frontend/layout/hooks.ts";
import { TrendingUp } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import LayoutStockDetail from "../features/stocks/components/LayoutStockDetail.tsx";
import SymbolSearchBox from "../features/stocks/components/SymbolSearchBox.tsx";
import { STOCKS_CHART_VIEW_ID, STOCKS_GRADIENT, STOCKS_HISTORY_VIEW_ID, STOCKS_MARKET_VIEW_ID, STOCKS_NEWS_VIEW_ID } from "../ids.ts";
import { normalizeSymbol } from "../lib/symbols.ts";
import { useStocksLayoutNavigation } from "../lib/useStocksLayoutNavigation.ts";

const QUICK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "SPY"];

/**
 * The symbol workspace: live quote, interactive chart, ranges, key stats and
 * performance for the symbol named by the panel params. Without one the panel
 * is the picker, which becomes the symbol it opens. Chart, news and history
 * open as separate panels beside this one.
 */
export default function StocksMarketPane({ params }: ViewProps) {
  const { openSymbol, openTool, clearSymbol } = useStocksLayoutNavigation();
  const panel = usePanel();
  const routeMarket = useRouteParamsFor(STOCKS_MARKET_VIEW_ID);
  const [inputValue, setInputValue] = useState("");

  // `/stocks/aapl` and a click on AAPL land on the same panel.
  const activeSymbol = params.symbol ? normalizeSymbol(params.symbol) : null;

  // The picker has done its job once the URL shows a symbol's market panel.
  const closePicker = useCallback(() => panel.close(), [panel]);
  const routeSymbol = routeMarket?.symbol;
  useEffect(() => {
    if (!activeSymbol && routeSymbol) closePicker();
  }, [activeSymbol, routeSymbol, closePicker]);

  const handleSymbolSelect = useCallback(
    (sym: string) => {
      const upper = sym.toUpperCase();
      setInputValue(upper);
      openSymbol(upper);
    },
    [openSymbol],
  );

  // Back to the picker: this panel closes and the URL drops the symbol.
  const handleClear = useCallback(() => {
    if (activeSymbol) clearSymbol(activeSymbol);
  }, [activeSymbol, clearSymbol]);

  return (
    <ViewShell
      header={<ViewHeader icon={TrendingUp} iconGradient={STOCKS_GRADIENT} title="Market" subtitle="Live quotes, charts, and key stats" />}
      pad="page"
      width="wide"
    >
      <div className="space-y-6">
        <div>
          <div className="flex gap-2">
            <SymbolSearchBox value={inputValue} onChange={setInputValue} onSelect={handleSymbolSelect} />
          </div>

          <div className="flex flex-wrap gap-1.5 mt-2">
            {QUICK_SYMBOLS.map(s => (
              <button
                type="button"
                key={s}
                onClick={() => handleSymbolSelect(s)}
                className={`px-2.5 py-1 text-xs font-mono font-medium rounded-lg transition-colors cursor-pointer focus-ring border ${
                  activeSymbol === s
                    ? "bg-accent-subtle border-accent text-accent-soft"
                    : "bg-secondary border-primary text-muted hover:text-primary hover:border-accent-strong"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {activeSymbol ? (
          <LayoutStockDetail
            key={activeSymbol}
            symbol={activeSymbol}
            onClear={handleClear}
            onOpenTool={openTool}
            chartViewId={STOCKS_CHART_VIEW_ID}
            newsViewId={STOCKS_NEWS_VIEW_ID}
            historyViewId={STOCKS_HISTORY_VIEW_ID}
          />
        ) : (
          <div className="px-4 py-8 bg-secondary/50 border border-dashed border-primary rounded-2xl text-center">
            <p className="text-sm text-secondary mb-1">Search a symbol or pick a quick ticker above</p>
            <p className="text-xs text-muted">Live quote · Interactive chart · Key stats · Ask AI</p>
          </div>
        )}
      </div>
    </ViewShell>
  );
}
