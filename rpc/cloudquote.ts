import TokenRingApp from "@tokenring-ai/app";
import {createRPCEndpoint} from "@tokenring-ai/rpc/createRPCEndpoint";
import CloudQuoteService from "../CloudQuoteService.ts";
import CloudQuoteRpcSchema from "./schema.ts";

export default createRPCEndpoint(CloudQuoteRpcSchema, {
  async getQuote(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getJSON('fcon/getQuote', {symbol: args.symbols.join(",")});
  },

  async getPriceHistory(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getJSON('fcon/getPriceHistory', {symbol: args.symbol, from: args.from, to: args.to});
  },

  async getPriceTicks(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getJSON('fcon/getPriceTicks', {symbol: args.symbol});
  },

  async getLeaders(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getJSON('fcon/getLeaders', {list: args.list, type: args.type, limit: args.limit, minPrice: args.minPrice, maxPrice: args.maxPrice});
  },

  async getHeadlinesBySecurity(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getHeadlinesBySecurity(args);
  },

  async getPriceChart(args, app: TokenRingApp) {
    return app.requireService(CloudQuoteService).getPriceChart(args);
  },
});
