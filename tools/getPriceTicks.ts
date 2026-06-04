import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { format, toZonedTime } from "date-fns-tz";
import { z } from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getPriceTicks";
const displayName = "Cloudquote/getPriceTicks";

async function execute({ symbol }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);

  if (!symbol) {
    throw new Error("symbol is required");
  }

  const result = await cloudQuoteService.getPriceTicks("fcon/getPriceTicks", {
    symbol,
  });
  if (!result || !Array.isArray(result.rows)) {
    throw new Error("Invalid response from getPriceTicks API");
  }

  // Create a copy with formatted dates since we can't modify the typed tuples
  const formattedRows = result.rows.map(row => {
    const dateStr = row[0] ? format(toZonedTime(row[0], "America/New_York"), "yyyy-MM-dd") : row[0];
    return [dateStr, row[1], row[2]] as [string, number, number];
  });

  return JSON.stringify(formattedRows);
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
