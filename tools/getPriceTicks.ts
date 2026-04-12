import type Agent from "@tokenring-ai/agent/Agent";
import type {TokenRingToolDefinition, TokenRingToolResult} from "@tokenring-ai/chat/schema";
import {format, toZonedTime} from "date-fns-tz";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getPriceTicks";
const displayName = "Cloudquote/getPriceTicks";

async function execute(
  {symbol}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolResult> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);

  if (!symbol) {
    throw new Error("symbol is required");
  }

  const result = await cloudQuoteService.getJSON("fcon/getPriceTicks", {
    symbol,
  });
  if (!result || !Array.isArray(result.rows)) {
    throw new Error("Invalid response from getPriceTicks API");
  }

  const rows = result.rows;
  for (const row of rows) {
    if (row[0]) {
      const zoned = toZonedTime(row[0], "America/New_York");
      row[0] = format(zoned, "yyyy-MM-dd");
    }
  }

  return JSON.stringify(rows);
}

const description =
  "Fetch intraday price ticks (time, price, volume) for a symbol. To use this API correctly, request a data range 5 min ahead and behind the time you are looking for";

const inputSchema = z.object({
  symbol: z.string().describe("Ticker symbol."),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
