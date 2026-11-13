import type { AppManifest } from "@tokenring-ai/one-frontend/layout/types.ts";
import type { PluginLayoutManifest } from "@tokenring-ai/one-frontend/plugins/layoutTypes.ts";
import { TrendingUp } from "lucide-react";
import {
  STOCKS_APP_ID,
  STOCKS_CHART_VIEW_ID,
  STOCKS_COMPARE_VIEW_ID,
  STOCKS_HISTORY_VIEW_ID,
  STOCKS_MARKET_VIEW_ID,
  STOCKS_NAVIGATOR_VIEW_ID,
  STOCKS_NEWS_VIEW_ID,
  STOCKS_PATH,
  STOCKS_SCREENER_VIEW_ID,
  STOCKS_VIEW_KIND,
} from "./ids.ts";

/**
 * Stocks: the navigator rail (search, watchlist, movers) beside the symbol
 * workspace. `/stocks/<SYMBOL>` opens that symbol's market panel; chart, news,
 * history, screener and compare tab in beside it. `/stocks/compare/<A,B,...>`
 * is the single comparison panel.
 */
export const STOCKS_APP: AppManifest = {
  id: STOCKS_APP_ID,
  path: STOCKS_PATH,
  label: "Stocks",
  shortLabel: "ST",
  description: "Quotes, charts, history, and news",
  group: "Data & tools",
  icon: TrendingUp,
  iconClass: "text-emerald-500",
  gradient: "from-emerald-500 to-green-600",
  views: [
    STOCKS_NAVIGATOR_VIEW_ID,
    STOCKS_MARKET_VIEW_ID,
    STOCKS_CHART_VIEW_ID,
    STOCKS_NEWS_VIEW_ID,
    STOCKS_HISTORY_VIEW_ID,
    STOCKS_SCREENER_VIEW_ID,
    STOCKS_COMPARE_VIEW_ID,
  ],
  primaryKind: STOCKS_VIEW_KIND,
  layout: {
    split: "row",
    sizes: [1, 3],
    children: [
      { presenter: "single", accepts: ["navigator"], items: [STOCKS_NAVIGATOR_VIEW_ID] },
      { presenter: "tabs", accepts: [STOCKS_VIEW_KIND], items: [STOCKS_MARKET_VIEW_ID], primary: true },
    ],
  },
};

export default {
  apps: [STOCKS_APP],
  kinds: [{ id: STOCKS_VIEW_KIND, label: "Stocks views", plural: "stocks views" }],
} satisfies PluginLayoutManifest;
