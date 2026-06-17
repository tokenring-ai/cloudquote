import { z } from "zod";
import {
  CloudQuoteFindStockResponseSchema,
  CloudQuoteLeadersResponseSchema,
  CloudQuotePriceHistoryResponseSchema,
  CloudQuotePriceTicksResponseSchema,
  CloudQuoteQuoteResponseSchema,
} from "../schema.ts";

const CloudQuoteRpcSchema = {
  name: "CloudQuote RPC",
  path: "/rpc/cloudquote",
  methods: {
    getQuote: {
      type: "query" as const,
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
      input: z.object({
        symbols: z.string(),
        start: z.number().exactOptional(),
        count: z.number().exactOptional(),
        minDate: z.string().exactOptional(),
        maxDate: z.string().exactOptional(),
      }),
      result: z.object({
        data: z.any(),
      }),
    },
    getPriceChart: {
      type: "query" as const,
      input: z.object({
        symbol: z.string(),
        interval: z.string(),
      }),
      result: z.object({
        svgDataUri: z.string(),
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
