import type TokenRingApp from "@tokenring-ai/app";
import { createPollingQueryStream } from "@tokenring-ai/rpc/createPollingQueryStream";
import { createRPCEndpoint } from "@tokenring-ai/rpc/createRPCEndpoint";
import type { RpcCallContext } from "@tokenring-ai/rpc/types";
import CloudQuoteService from "../CloudQuoteService.ts";
import WatchlistService from "../WatchlistService.ts";
import CloudQuoteRpcSchema from "./schema.ts";

/**
 * Live quote rows for a symbol set, polled upstream and pushed on change. Every
 * dashboard panel shares one subscription per symbol list, so a board plus
 * several quote panels cost one upstream poll, not one each.
 */
const streamQuotes = createPollingQueryStream({
  intervalMs: 15000,
  poll: (args: { symbols: string[] }, app: TokenRingApp) => app.requireService(CloudQuoteService).getQuote("fcon/getQuote", { symbol: args.symbols.join(",") }),
});

export default createRPCEndpoint(CloudQuoteRpcSchema, {
  getStatus(_args, app: TokenRingApp) {
    return { configured: app.requireService(CloudQuoteService).isConfigured() };
  },

  getWatchlist(_args, app: TokenRingApp, context?: RpcCallContext) {
    const watchlists = app.requireService(WatchlistService);
    return watchlists.get(watchlists.scopeFor(context?.username));
  },

  saveWatchlist(args, app: TokenRingApp, context?: RpcCallContext) {
    const watchlists = app.requireService(WatchlistService);
    return watchlists.save(watchlists.scopeFor(context?.username), args.symbols, args.expectedUpdatedAt);
  },

  getQuote(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getQuote("fcon/getQuote", { symbol: args.symbols.join(",") });
  },

  streamQuotes,

  getPriceHistory(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getPriceHistory("fcon/getPriceHistory", {
      symbol: args.symbol,
      from: args.from,
      to: args.to,
    });
  },

  getPriceTicks(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getPriceTicks("fcon/getPriceTicks", { symbol: args.symbol });
  },

  getLeaders(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getLeaders("fcon/getLeaders", {
      list: args.list,
      type: args.type,
      limit: args.limit,
      minPrice: args.minPrice,
      maxPrice: args.maxPrice,
    });
  },

  getHeadlinesBySecurity(args, app: TokenRingApp) {
    return app
      .requireService(CloudQuoteService)
      .getHeadlinesBySecurity(args)
      .then(data => ({ data }));
  },

  findStock(args, app: TokenRingApp) {
    const term = args.search;
    const search = `SYMBOL/${term}|SYMBOL/${term}*|NAME/${term}*|WORD/${term}|WORD/${term}*`;
    return app.requireService(CloudQuoteService).findStock("fcon/findStock", {
      sort: "Popularity",
      limit: args.limit ?? 10,
      search,
    });
  },
});
