import type { ViewManifest } from "@tokenring-ai/one-frontend/dock/types.ts";
import type { PluginFrontendManifest } from "@tokenring-ai/one-frontend/plugins/types.ts";
import { CandlestickChart, GitCompareArrows, History, Newspaper, ScanSearch, TrendingUp } from "lucide-react";

export const STOCKS_DASHBOARD_ID = "stocks";
export const STOCKS_MARKET_VIEW = "stocks-market";
export const STOCKS_NAVIGATOR_VIEW = "stocks-navigator";
export const STOCKS_CHART_VIEW = "stocks-chart";
export const STOCKS_NEWS_VIEW = "stocks-news";
export const STOCKS_HISTORY_VIEW = "stocks-history";
export const STOCKS_SCREENER_VIEW = "stocks-screener";
export const STOCKS_COMPARE_VIEW = "stocks-compare";

/** The navigator owns the left rail group; symbol panels never tab into it. */
export const STOCKS_SIDEBAR_VIEWS: readonly string[] = [STOCKS_NAVIGATOR_VIEW];

/**
 * The symbol workspace: live quote header, interactive chart, ranges, key
 * stats and performance. Without a `symbol` the panel is a picker (search box
 * plus quick tickers) that becomes the symbol it opens.
 */
export const stocksMarketViewManifest = {
  id: STOCKS_MARKET_VIEW,
  title: "Market",
  description: "Live quote, chart, ranges and key stats for a symbol",
  icon: TrendingUp,
  availableOn: ["home", "any"],
  instanceable: true,
  defaultSize: { width: 720, height: 520 },
  minimumSize: { width: 320, height: 240 },
  tags: ["finance"],
} satisfies ViewManifest;

/** Left rail: search, the user's watchlist and the market movers boards. */
export const stocksNavigatorViewManifest = {
  id: STOCKS_NAVIGATOR_VIEW,
  title: "Navigator",
  description: "Symbol search, watchlist and market movers",
  icon: TrendingUp,
  availableOn: ["home", "any"],
  defaultSize: { width: 300, height: 520 },
  minimumSize: { width: 220, height: 300 },
  tags: ["finance"],
} satisfies ViewManifest;

/** Full-height charting: candles/line/area, volume, moving averages, log scale. */
export const stocksChartViewManifest = {
  id: STOCKS_CHART_VIEW,
  title: "Chart",
  description: "Interactive price chart with volume and moving averages",
  icon: CandlestickChart,
  availableOn: ["any"],
  instanceable: true,
  defaultSize: { width: 820, height: 480 },
  minimumSize: { width: 420, height: 300 },
  tags: ["finance", "charts"],
} satisfies ViewManifest;

/** Per-symbol news with an in-app article reader. */
export const stocksNewsViewManifest = {
  id: STOCKS_NEWS_VIEW,
  title: "News",
  description: "Headlines and articles for a symbol",
  icon: Newspaper,
  availableOn: ["any"],
  instanceable: true,
  defaultSize: { width: 460, height: 520 },
  minimumSize: { width: 300, height: 240 },
  tags: ["finance", "news"],
} satisfies ViewManifest;

/** Sortable OHLCV table with adjusted close and CSV export. */
export const stocksHistoryViewManifest = {
  id: STOCKS_HISTORY_VIEW,
  title: "History",
  description: "Historical OHLCV data with adjusted close and CSV export",
  icon: History,
  availableOn: ["any"],
  instanceable: true,
  defaultSize: { width: 640, height: 520 },
  minimumSize: { width: 380, height: 280 },
  tags: ["finance"],
} satisfies ViewManifest;

/** Movers boards with security-type and price-range filters. */
export const stocksScreenerViewManifest = {
  id: STOCKS_SCREENER_VIEW,
  title: "Screener",
  description: "Gainers, losers and most active with filters",
  icon: ScanSearch,
  availableOn: ["home", "any"],
  defaultSize: { width: 620, height: 520 },
  minimumSize: { width: 380, height: 280 },
  tags: ["finance"],
} satisfies ViewManifest;

/** Overlay up to four symbols' normalized performance on one chart. */
export const stocksCompareViewManifest = {
  id: STOCKS_COMPARE_VIEW,
  title: "Compare",
  description: "Normalized performance of up to four symbols",
  icon: GitCompareArrows,
  availableOn: ["any"],
  defaultSize: { width: 720, height: 480 },
  minimumSize: { width: 420, height: 300 },
  tags: ["finance", "charts"],
} satisfies ViewManifest;

/**
 * Metadata for the stocks dashboard shipped by this plugin. The frontend
 * merges this into its registry and derives the SPA server routes from it.
 */
export default {
  id: STOCKS_DASHBOARD_ID,
  path: "/stocks",
  label: "Stocks",
  shortLabel: "ST",
  description: "Quotes, charts, history, and news",
  group: "Data & tools",
  icon: TrendingUp,
  iconClass: "text-emerald-500",
  gradient: "from-emerald-500 to-green-600",
  views: [
    stocksNavigatorViewManifest,
    stocksMarketViewManifest,
    stocksChartViewManifest,
    stocksNewsViewManifest,
    stocksHistoryViewManifest,
    stocksScreenerViewManifest,
    stocksCompareViewManifest,
  ],
} satisfies PluginFrontendManifest;
