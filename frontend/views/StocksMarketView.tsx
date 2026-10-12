import ViewHeader from "@tokenring-ai/one-frontend/components/ui/ViewHeader.tsx";
import ViewShell from "@tokenring-ai/one-frontend/components/ui/ViewShell.tsx";
import type { ViewProps } from "@tokenring-ai/one-frontend/dock/types.ts";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import StockDetail from "../features/stocks/components/StockDetail.tsx";
import SymbolSearchBox from "../features/stocks/components/SymbolSearchBox.tsx";
import { type StocksViewParams, stocksPath, useStocksNavigation } from "../lib/stocksShared.ts";
import { STOCKS_CHART_VIEW, STOCKS_DASHBOARD_ID, STOCKS_HISTORY_VIEW, STOCKS_NEWS_VIEW } from "../manifest.ts";

const QUICK_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "TSLA", "META", "SPY"];

/**
 * The symbol workspace: live quote, interactive chart, ranges, key stats and
 * performance for the symbol named by the panel params. Without one the panel
 * is the picker, which becomes the symbol it opens. Chart, news and history
 * open as separate panels beside this one.
 */
export default function StocksMarketView({ params, panel }: ViewProps<StocksViewParams>) {
  const navigate = useNavigate();
  const { openSymbol, openTool, onDashboard } = useStocksNavigation();
  const [inputValue, setInputValue] = useState("");

  const activeSymbol = params.symbol ?? null;

  const handleSymbolSelect = useCallback(
    (sym: string) => {
      const upper = sym.toUpperCase();
      setInputValue(upper);
      openSymbol(upper);
    },
    [openSymbol],
  );

  // Back to the picker: the panel reverts in place on the Stocks dashboard and the URL drops the symbol.
  const handleClear = useCallback(() => {
    if (onDashboard) panel.updateParams({ symbol: undefined });
    void navigate(stocksPath(null));
  }, [navigate, onDashboard, panel]);

  return (
    <ViewShell header={<ViewHeader dashboardId={STOCKS_DASHBOARD_ID} title="Market" subtitle="Live quotes, charts, and key stats" />} pad="page" width="wide">
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
          <StockDetail
            key={activeSymbol}
            symbol={activeSymbol}
            onClear={handleClear}
            onOpenTool={openTool}
            chartViewId={STOCKS_CHART_VIEW}
            newsViewId={STOCKS_NEWS_VIEW}
            historyViewId={STOCKS_HISTORY_VIEW}
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
