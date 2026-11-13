import { defineView } from "@tokenring-ai/one-frontend/layout/define.ts";
import type { PluginLayoutViews } from "@tokenring-ai/one-frontend/plugins/layoutTypes.ts";
import { CandlestickChart, GitCompareArrows, History, Newspaper, ScanSearch, TrendingUp } from "lucide-react";
import { lazy } from "react";
import {
  STOCKS_CHART_VIEW_ID,
  STOCKS_COMPARE_VIEW_ID,
  STOCKS_HISTORY_VIEW_ID,
  STOCKS_MARKET_VIEW_ID,
  STOCKS_NAVIGATOR_VIEW_ID,
  STOCKS_NEWS_VIEW_ID,
  STOCKS_SCREENER_VIEW_ID,
  STOCKS_VIEW_KIND,
} from "./ids.ts";
import { normalizeSymbol } from "./lib/symbols.ts";

const StocksNavigatorPane = lazy(() => import("./panes/StocksNavigatorPane.tsx"));
const StocksMarketPane = lazy(() => import("./panes/StocksMarketPane.tsx"));
const StocksChartPane = lazy(() => import("./panes/StocksChartPane.tsx"));
const StocksNewsPane = lazy(() => import("./panes/StocksNewsPane.tsx"));
const StocksHistoryPane = lazy(() => import("./panes/StocksHistoryPane.tsx"));
const StocksScreenerPane = lazy(() => import("./panes/StocksScreenerPane.tsx"));
const StocksComparePane = lazy(() => import("./panes/StocksComparePane.tsx"));

const symbolKey = (p: Record<string, string>) => normalizeSymbol(p["symbol"] ?? "");

export default {
  views: [
    defineView({
      id: STOCKS_NAVIGATOR_VIEW_ID,
      kind: "navigator",
      title: "Navigator",
      description: "Symbol search, watchlist and market movers",
      icon: TrendingUp,
      component: StocksNavigatorPane,
    }),
    // `/stocks` is the symbol picker (no symbol); `/stocks/<SYMBOL>` is that symbol's workspace.
    defineView({
      id: STOCKS_MARKET_VIEW_ID,
      kind: STOCKS_VIEW_KIND,
      title: p => (p["symbol"] ? `Market · ${normalizeSymbol(p["symbol"])}` : "Market"),
      description: "Live quote, chart, ranges and key stats for a symbol",
      icon: TrendingUp,
      route: ":symbol?",
      instanceKey: p => symbolKey(p) || "new",
      component: StocksMarketPane,
    }),
    defineView({
      id: STOCKS_CHART_VIEW_ID,
      kind: STOCKS_VIEW_KIND,
      title: p => `Chart · ${symbolKey(p)}`,
      description: "Interactive price chart with volume and moving averages",
      icon: CandlestickChart,
      instanceKey: symbolKey,
      component: StocksChartPane,
    }),
    defineView({
      id: STOCKS_NEWS_VIEW_ID,
      kind: STOCKS_VIEW_KIND,
      title: p => `News · ${symbolKey(p)}`,
      description: "Headlines and articles for a symbol",
      icon: Newspaper,
      instanceKey: symbolKey,
      component: StocksNewsPane,
    }),
    defineView({
      id: STOCKS_HISTORY_VIEW_ID,
      kind: STOCKS_VIEW_KIND,
      title: p => `History · ${symbolKey(p)}`,
      description: "Historical OHLCV data with adjusted close and CSV export",
      icon: History,
      instanceKey: symbolKey,
      component: StocksHistoryPane,
    }),
    defineView({
      id: STOCKS_SCREENER_VIEW_ID,
      kind: STOCKS_VIEW_KIND,
      title: "Screener",
      description: "Gainers, losers and most active with filters",
      icon: ScanSearch,
      component: StocksScreenerPane,
    }),
    // One panel whose symbol list (comma-joined, at most four) follows the URL and is edited in place.
    defineView({
      id: STOCKS_COMPARE_VIEW_ID,
      kind: STOCKS_VIEW_KIND,
      title: "Compare",
      description: "Normalized performance of up to four symbols",
      icon: GitCompareArrows,
      route: "compare/:symbols?",
      instanceKey: () => "",
      component: StocksComparePane,
    }),
  ],
} satisfies PluginLayoutViews;
