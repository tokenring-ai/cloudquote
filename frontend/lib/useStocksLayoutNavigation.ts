import { useLayout, usePaneLink } from "@tokenring-ai/one-frontend/layout/hooks.ts";
import { useCallback } from "react";
import { STOCKS_COMPARE_VIEW_ID, STOCKS_MARKET_VIEW_ID } from "../ids.ts";
import { MAX_COMPARE_SYMBOLS, normalizeSymbol, normalizeSymbols } from "./symbols.ts";

/**
 * Navigation between the Stocks views on the layout engine. Opening a symbol
 * navigates to `/stocks/<SYMBOL>` (the engine opens and focuses its market
 * panel); the parameter-less picker closes itself once a symbol is showing.
 */
export function useStocksLayoutNavigation() {
  const open = usePaneLink();
  const layout = useLayout();

  const openSymbol = useCallback(
    (raw: string) => {
      const symbol = normalizeSymbol(raw);
      if (symbol) open(STOCKS_MARKET_VIEW_ID, { symbol });
    },
    [open],
  );

  /** Opens one of the per-symbol tool views (chart, news, history), tabbed beside whatever is open. */
  const openTool = useCallback((viewId: string, symbol: string) => open(viewId, { symbol }), [open]);

  /** Opens (or re-seeds) the single Compare panel with a symbol selection (2-4 symbols). */
  const openCompare = useCallback(
    (symbols: readonly string[]) => open(STOCKS_COMPARE_VIEW_ID, compareParams(normalizeSymbols(symbols).slice(0, MAX_COMPARE_SYMBOLS))),
    [open],
  );

  /** Back to the picker: the symbol's panel closes and the URL drops the symbol. */
  const clearSymbol = useCallback(
    (symbol: string) => {
      open(STOCKS_MARKET_VIEW_ID, {});
      layout.close(STOCKS_MARKET_VIEW_ID, { symbol });
    },
    [open, layout],
  );

  return { openSymbol, openTool, openCompare, clearSymbol };
}

/** Compare params carry the symbol list as one comma-joined route segment. */
export function compareParams(symbols: readonly string[]): Record<string, string> {
  return symbols.length > 0 ? { symbols: symbols.join(",") } : {};
}

export function parseCompareSymbols(raw: string | undefined): string[] {
  return normalizeSymbols((raw ?? "").split(",")).slice(0, MAX_COMPARE_SYMBOLS);
}
