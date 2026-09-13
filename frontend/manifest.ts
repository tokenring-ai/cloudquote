import { TrendingUp } from "lucide-react";
import type { PluginAppManifest } from "@tokenring-ai/one-frontend/plugins/types.ts";

/**
 * Metadata for the stocks app shipped by this plugin. The frontend merges
 * this into its app registry and derives the SPA server routes from it.
 */
export default {
  id: "stocks",
  path: "/stocks",
  label: "Stocks",
  shortLabel: "ST",
  description: "Quotes, charts, history, and news",
  group: "Data & tools",
  icon: TrendingUp,
  iconClass: "text-emerald-500",
  gradient: "from-emerald-500 to-green-600",
} satisfies PluginAppManifest;
