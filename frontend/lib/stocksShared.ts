import { useDashboardApi } from "@tokenring-ai/one-frontend/dock/DashboardApiContext.tsx";
import { openInMainArea } from "@tokenring-ai/one-frontend/dock/layout/mainArea.ts";
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { STOCKS_COMPARE_VIEW, STOCKS_DASHBOARD_ID, STOCKS_MARKET_VIEW, STOCKS_NAVIGATOR_VIEW, STOCKS_SIDEBAR_VIEWS } from "../manifest.ts";

export const StocksViewParams = z.object({
  /** Absent for the picker panel, which becomes the symbol it opens. */
  symbol: z.string().min(1).optional(),
});
export type StocksViewParams = z.infer<typeof StocksViewParams>;

/** Params of the per-symbol tool views (chart, news, history). */
export const SymbolParams = z.object({
  symbol: z.string().min(1),
});
export type SymbolParams = z.infer<typeof SymbolParams>;

/** Compare works on a symbol set; seeded from the screener/watchlist but editable in place. */
export const CompareParams = z.object({
  symbols: z.array(z.string().min(1)).min(1).max(4).optional(),
});
export type CompareParams = z.infer<typeof CompareParams>;

export const MAX_COMPARE_SYMBOLS = 4;

/** Tickers are case-insensitive; every panel, route and instance key uses the upper-case form. */
export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/** Upper-cased, de-duplicated, empties dropped, order kept. */
export function normalizeSymbols(symbols: readonly string[]): string[] {
  return [...new Set(symbols.map(normalizeSymbol).filter(Boolean))];
}

export const STOCKS_PATH = "/stocks";

export function stocksPath(symbol: string | null | undefined): string {
  return symbol ? `${STOCKS_PATH}/${encodeURIComponent(symbol)}` : STOCKS_PATH;
}

/**
 * Navigation between the Stocks views. Opening a symbol both opens its market
 * panel right away (so a closed panel re-opens even when the URL does not
 * change) and updates the URL. The first symbol picked fills the
 * parameter-less picker panel instead of adding a second one.
 * Rendered on another dashboard, it only navigates here.
 */
export function useStocksNavigation() {
  const navigate = useNavigate();
  const dashboard = useDashboardApi();
  const onDashboard = dashboard.dashboardId === STOCKS_DASHBOARD_ID;

  const openSymbol = useCallback(
    (raw: string) => {
      const symbol = normalizeSymbol(raw);
      if (!symbol) return;
      if (onDashboard) openInMainArea(dashboard, STOCKS_MARKET_VIEW, { symbol }, { sidebarViews: STOCKS_SIDEBAR_VIEWS, fillPlaceholder: true });
      void navigate(stocksPath(symbol));
    },
    [dashboard, navigate, onDashboard],
  );

  /**
   * Opens one of the per-symbol tool views (chart, news, history) in the main
   * area, tabbed beside whatever is already open. Only meaningful on the Stocks
   * dashboard — the URL tracks the market view's symbol only.
   */
  const openTool = useCallback(
    (viewId: string, symbol: string) => {
      if (!onDashboard) return;
      openInMainArea(dashboard, viewId, { symbol }, { sidebarViews: STOCKS_SIDEBAR_VIEWS, fillPlaceholder: true });
    },
    [dashboard, onDashboard],
  );

  /**
   * Opens the Compare view seeded with a symbol selection (2–4 symbols). There
   * is one compare panel per dashboard: when it is already open its symbol set
   * is replaced in place (focusing alone would keep showing the old selection).
   */
  const openCompare = useCallback(
    (symbols: string[]) => {
      if (!onDashboard) return;
      const params = { symbols: normalizeSymbols(symbols).slice(0, MAX_COMPARE_SYMBOLS) };
      const existing = dashboard.listPanels().find(panel => panel.viewId === STOCKS_COMPARE_VIEW);
      if (existing && dashboard.updateViewParams(existing.panelId, params)) {
        dashboard.focusView(existing.panelId);
        return;
      }
      openInMainArea(dashboard, STOCKS_COMPARE_VIEW, params, { sidebarViews: STOCKS_SIDEBAR_VIEWS });
    },
    [dashboard, onDashboard],
  );

  return { openSymbol, openTool, openCompare, onDashboard, navigatorViewId: STOCKS_NAVIGATOR_VIEW };
}
