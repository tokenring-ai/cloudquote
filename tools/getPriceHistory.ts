import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import { format, toZonedTime } from "date-fns-tz";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getPriceHistory";

async function execute(
  {symbol, from, to}: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<any> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);

  if (!symbol) {
    throw new Error("symbol is required");
  }

  const { rows} =  await cloudQuoteService.getJSON('fcon/getPriceHistory', {symbol, from, to});
  for (let row of rows) {
    const zoned = toZonedTime(row[0], 'America/New_York');
    row[0] = format(zoned, 'yyyy-MM-dd');
  }

  return rows;
}

const description = "Fetch historical daily price data for a symbol. To use this API correctly, request a date range 1 day ahead and 1 day behind the date you are looking for";

const inputSchema = z.object({
  symbol: z.string().describe("Ticker symbol."),
  from: z.string().describe("Start date (YYYY-MM-DD). Must be at least 1 day before date requested").optional(),
  to: z.string().describe("End date (YYYY-MM-DD). Must be at least 1 day after date requested").optional(),
});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;