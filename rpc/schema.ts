import {z} from "zod";

const CloudQuoteRpcSchema = {
  name: "CloudQuote RPC",
  path: "/rpc/cloudquote",
  methods: {
    getQuote: {
      type: "query" as const,
      input: z.object({
        symbols: z.array(z.string()),
      }),
      result: z.object({
        data: z.any(),
      }),
    },
    getPriceHistory: {
      type: "query" as const,
      input: z.object({
        symbol: z.string(),
        from: z.string().optional(),
        to: z.string().optional(),
      }),
      result: z.object({
        rows: z.array(z.array(z.any())),
      }),
    },
    getPriceTicks: {
      type: "query" as const,
      input: z.object({
        symbol: z.string(),
      }),
      result: z.object({
        rows: z.array(z.array(z.any())),
      }),
    },
    getLeaders: {
      type: "query" as const,
      input: z.object({
        list: z.enum(["MOSTACTIVE", "PERCENTGAINERS", "PERCENTLOSERS"]),
        type: z.enum(["STOCK", "ETF"]).optional(),
        limit: z.number().min(1).max(50).optional(),
        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),
      }),
      result: z.object({
        data: z.array(z.any()),
      }),
    },
    getHeadlinesBySecurity: {
      type: "query" as const,
      input: z.object({
        symbols: z.string(),
        start: z.number().optional(),
        count: z.number().optional(),
        minDate: z.string().optional(),
        maxDate: z.string().optional(),
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
  },
};

export default CloudQuoteRpcSchema;
