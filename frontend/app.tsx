import { openInMainArea } from "@tokenring-ai/one-frontend/dock/layout/mainArea.ts";
import type { PluginFrontendContribution } from "@tokenring-ai/one-frontend/plugins/types.ts";
import { lazy } from "react";
import { CompareParams, normalizeSymbol, StocksViewParams, SymbolParams, stocksPath } from "./lib/stocksShared.ts";
import manifest, {
  STOCKS_MARKET_VIEW,
  STOCKS_NAVIGATOR_VIEW,
  STOCKS_SIDEBAR_VIEWS,
  stocksChartViewManifest,
  stocksCompareViewManifest,
  stocksHistoryViewManifest,
  stocksMarketViewManifest,
  stocksNavigatorViewManifest,
  stocksNewsViewManifest,
  stocksScreenerViewManifest,
} from "./manifest.ts";

export { stocksPath };

/**
 * The Stocks dashboard: a navigator rail (search, watchlist, movers) beside the
 * symbol workspace, with per-symbol chart, news and history views opening into
 * the main area. `/stocks/<SYMBOL>` opens (or focuses) that symbol; the active
 * market panel keeps the URL in step. Discovered by
 * `frontend/src/plugins/registry.ts`.
 */
export default {
  ...manifest,
  views: [
    { ...stocksNavigatorViewManifest, component: lazy(() => import("./views/StocksNavigatorView.tsx")) },
    {
      ...stocksMarketViewManifest,
      params: StocksViewParams,
      instanceKey: params => params.symbol ?? "new",
      titleFor: params => (params.symbol ? `Market · ${params.symbol}` : "Market"),
      component: lazy(() => import("./views/StocksMarketView.tsx")),
    },
    {
      ...stocksChartViewManifest,
      params: SymbolParams,
      instanceKey: params => params.symbol,
      titleFor: params => `Chart · ${params.symbol}`,
      component: lazy(() => import("./views/StocksChartView.tsx")),
    },
    {
      ...stocksNewsViewManifest,
      params: SymbolParams,
      instanceKey: params => params.symbol,
      titleFor: params => `News · ${params.symbol}`,
      component: lazy(() => import("./views/StocksNewsView.tsx")),
    },
    {
      ...stocksHistoryViewManifest,
      params: SymbolParams,
      instanceKey: params => params.symbol,
      titleFor: params => `History · ${params.symbol}`,
      component: lazy(() => import("./views/StocksHistoryView.tsx")),
    },
    { ...stocksScreenerViewManifest, component: lazy(() => import("./views/StocksScreenerView.tsx")) },
    {
      ...stocksCompareViewManifest,
      // A single panel whose symbol set is edited (and replaced by "Compare selected") in place.
      params: CompareParams,
      component: lazy(() => import("./views/StocksCompareView.tsx")),
    },
  ],
  dashboards: [
    {
      ...manifest,
      routePath: "/stocks/:symbol?",
      defaultLayout: {
        kind: "row",
        sizes: [1, 3],
        children: [
          { kind: "panel", view: STOCKS_NAVIGATOR_VIEW },
          { kind: "panel", view: STOCKS_MARKET_VIEW },
        ],
      },
      onNavigate({ params }, api) {
        // `/stocks/aapl` and a click on AAPL must land on the same panel.
        const symbol = params.symbol ? normalizeSymbol(params.symbol) : "";
        if (symbol) {
          openInMainArea(api, STOCKS_MARKET_VIEW, { symbol }, { sidebarViews: STOCKS_SIDEBAR_VIEWS, fillPlaceholder: true });
        }
      },
      pathForActivePanel(panel, _match) {
        if (panel?.viewId !== STOCKS_MARKET_VIEW || typeof panel.params.symbol !== "string") return null;
        return stocksPath(panel.params.symbol);
      },
      documentTitle: ({ params }) => (params.symbol ? `${params.symbol} · Stocks` : "Stocks"),
    },
  ],
} satisfies PluginFrontendContribution;
