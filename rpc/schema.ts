import { z } from "zod";
import {
  CloudQuoteFindStockResponseSchema,
  CloudQuoteHeadlinesBySecurityParamsSchema,
  CloudQuoteHeadlinesResponseSchema,
  CloudQuoteLeadersResponseSchema,
  CloudQuotePriceHistoryResponseSchema,
  CloudQuotePriceTicksResponseSchema,
  CloudQuoteQuoteResponseSchema,
} from "../schema.ts";

const WatchlistRecordShape = {
  /** Normalized (uppercase, deduped) symbols in the user's order. */
  symbols: z.array(z.string()),
  /** Epoch ms of the last save; 0 when the user has never saved a watchlist. */
  updatedAt: z.number(),
};

const CloudQuoteRpcSchema = {
  name: "CloudQuote RPC",
  path: "/rpc/cloudquote",
  methods: {
    getStatus: {
      type: "query" as const,
      input: z.object({}),
      result: z.object({
        /** False when no CloudQuote API key is set (config `cloudquote.apiKey` / env CLOUDQUOTE_API_KEY). */
        configured: z.boolean(),
      }),
    },
    getWatchlist: {
      type: "query" as const,
      input: z.object({}),
      result: z.object(WatchlistRecordShape),
    },
    saveWatchlist: {
      type: "mutation" as const,
      input: z.object({
        symbols: z.array(z.string()).max(1000),
        /** Optimistic concurrency: rejected with `conflict` when the stored list is newer than this. */
        expectedUpdatedAt: z.number().exactOptional(),
      }),
      result: z.object({ status: z.enum(["success", "conflict"]), ...WatchlistRecordShape }),
    },
    getQuote: {
      type: "query" as const,
      input: z.object({
        symbols: z.array(z.string()),
      }),
      result: CloudQuoteQuoteResponseSchema,
    },
    streamQuotes: {
      type: "stream" as const,
      input: z.object({
        symbols: z.array(z.string()),
      }),
      result: CloudQuoteQuoteResponseSchema,
    },
    getPriceHistory: {
      type: "query" as const,
      input: z.object({
        symbol: z.string(),
        from: z.string().exactOptional(),
        to: z.string().exactOptional(),
      }),
      result: CloudQuotePriceHistoryResponseSchema,
    },
    getPriceTicks: {
      type: "query" as const,
      input: z.object({
        symbol: z.string(),
      }),
      result: CloudQuotePriceTicksResponseSchema,
    },
    getLeaders: {
      type: "query" as const,
      input: z.object({
        list: z.enum(["MOSTACTIVE", "PERCENTGAINERS", "PERCENTLOSERS"]),
        type: z.enum(["STOCK", "ETF"]).exactOptional(),
        limit: z.number().min(1).max(50).exactOptional(),
        minPrice: z.number().exactOptional(),
        maxPrice: z.number().exactOptional(),
      }),
      result: CloudQuoteLeadersResponseSchema,
    },
    getHeadlinesBySecurity: {
      type: "query" as const,
      input: CloudQuoteHeadlinesBySecurityParamsSchema,
      result: z.object({
        data: CloudQuoteHeadlinesResponseSchema,
      }),
    },
    findStock: {
      type: "query" as const,
      input: z.object({
        search: z.string(),
        limit: z.number().min(1).max(50).exactOptional(),
      }),
      result: CloudQuoteFindStockResponseSchema,
    },
  },
};

export default CloudQuoteRpcSchema;
