import manifest from "./manifest.ts";
import StocksApp from "./StocksApp.tsx";
import type { PluginAppDefinition } from "@tokenring-ai/one-frontend/plugins/types.ts";

/**
 * The stocks app contributed to the TokenRing One frontend by this
 * plugin. Discovered by `frontend/src/plugins/registry.ts`.
 */
export default {
  ...manifest,
  routePath: "/stocks",
  component: StocksApp,
} satisfies PluginAppDefinition;
