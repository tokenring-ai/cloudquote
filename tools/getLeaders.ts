import type {Registry} from "@token-ring/registry";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

export const name = "cloudquote/getLeaders";

interface Params {
  list?: string;
  type?: string;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}

export async function execute(
  {list, type, limit, minPrice, maxPrice}: Params,
  registry: Registry,
): Promise<any> {
  const cloudQuoteService = registry.requireFirstServiceByType(CloudQuoteService);
  if (! list) {
    throw new Error("list is required");
  }

  return await cloudQuoteService.getJSON('fcon/getLeaders', {list, type, limit, minPrice, maxPrice});
}

export const description = "Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers, or most popular stocks).";

export const inputSchema = z.object({
  list: z.enum(["MOSTACTIVE", "PERCENTGAINERS", "PERCENTLOSERS"]).describe("Type of list."),
  type: z.enum(["STOCK", "ETF"]).describe("Security type.").optional(),
  limit: z.number().int().min(1).max(50).describe("Max number of results.").optional(),
  maxPrice: z.number().optional()
});