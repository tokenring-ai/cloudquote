import type {Registry} from "@token-ring/registry";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

export const name = "cloudquote/getQuote";

export async function execute(
  {symbols}: {symbols?: string[]},
  registry: Registry,
): Promise<any> {
  const cloudQuoteService = registry.requireFirstServiceByType(CloudQuoteService);
  if (!symbols || symbols.length === 0) {
    throw new Error("symbols array is required and cannot be empty");
  }
  return await cloudQuoteService.getJSON('fcon/getQuote', {symbol: symbols.join(",")});
}

export const description = "Retrieve pricing and metadata for given security symbols.";

export const inputSchema = z.object({
  symbols: z.array(z.string()).describe("Array of ticker symbols to fetch (e.g. ['AAPL', 'GOOGL', 'MSFT'])."),
});