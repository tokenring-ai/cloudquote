import type TokenRingApp from "@tokenring-ai/app";
import {createRPCEndpoint} from "@tokenring-ai/rpc/createRPCEndpoint";
import CloudQuoteService from "../CloudQuoteService.ts";
import CloudQuoteRpcSchema from "./schema.ts";

export default createRPCEndpoint(CloudQuoteRpcSchema, {
  getQuote(args, app: TokenRingApp) {
    return app
      .requireService(CloudQuoteService)
      .getJSON("fcon/getQuote", {symbol: args.symbols.join(",")});
  },

  getPriceHistory(args, app: TokenRingApp) {
    return app
      .requireService(CloudQuoteService)
      .getJSON("fcon/getPriceHistory", {
        symbol: args.symbol,
        from: args.from,
        to: args.to,
      });
  },

  getPriceTicks(args, app: TokenRingApp) {
    return app
      .requireService(CloudQuoteService)
      .getJSON("fcon/getPriceTicks", {symbol: args.symbol});
  },

  getLeaders(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getJSON("fcon/getLeaders", {
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
      .getJSON("newsrpm/getHeadlinesBySecurity", args);
  },

  getPriceChart(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getPriceChart(args);
  },
});
