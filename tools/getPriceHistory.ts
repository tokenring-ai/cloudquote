import type {Registry} from "@token-ring/registry";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";
import moment from "moment-timezone";

export const name = "cloudquote/getPriceHistory";

export async function execute(
  {symbol, from, to}: {symbol?: string; from?: string; to?: string},
  registry: Registry,
): Promise<any> {
  const cloudQuoteService = registry.requireFirstServiceByType(CloudQuoteService);

  if (!symbol) {
    throw new Error("symbol is required");
  }

  const { rows} =  await cloudQuoteService.getJSON('fcon/getPriceHistory', {symbol, from, to});
  for (let row of rows) {
    row[0] = moment.tz(row[0], 'America/New_York').format('YYYY-MM-DD');
  }

  return rows;
}

export const description = "Fetch historical daily price data for a symbol. To use this API correctly, request a date range 1 day ahead and 1 day behind the date you are looking for";

export const inputSchema = z.object({
  symbol: z.string().describe("Ticker symbol."),
  from: z.string().describe("Start date (YYYY-MM-DD). Must be at least 1 day before date requested").optional(),
  to: z.string().describe("End date (YYYY-MM-DD). Must be at least 1 day after date requested").optional(),
});