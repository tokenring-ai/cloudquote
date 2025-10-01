import Agent from "@tokenring-ai/agent/Agent";
import { format, toZonedTime } from "date-fns-tz";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

export const name = "cloudquote/getPriceTicks";

export async function execute(
  {symbol}: {symbol?: string},
  agent: Agent,
): Promise<any> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);

  if (!symbol) {
    throw new Error("symbol is required");
  }

  const { rows} =  await cloudQuoteService.getJSON('fcon/getPriceTicks', {symbol});
  for (let row of rows) {
    const zoned = toZonedTime(row[0], 'America/New_York');
    row[0] = format(zoned, 'yyyy-MM-dd');
  }

  return rows;
}

export const description = "Fetch intraday price ticks (time, price, volume) for a symbol. To use this API correctly, request a data range 5 min ahead and behind the time you are looking for";

export const inputSchema = z.object({
  symbol: z.string().describe("Ticker symbol."),
});