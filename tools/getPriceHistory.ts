import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { format, toZonedTime } from "date-fns-tz";
import { z } from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getPriceHistory";
const displayName = "Cloudquote/getPriceHistory";

async function execute({ symbol, from, to }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);

  if (!symbol) {
    throw new Error("symbol is required");
  }

  const result = await cloudQuoteService.getPriceHistory("fcon/getPriceHistory", {
    symbol,
    from,
    to,
  });
  if (!result || !Array.isArray(result.rows)) {
    throw new Error("Invalid response from getPriceHistory API");
  }

  // Create a copy with formatted dates since we can't modify the typed tuples
  const formattedRows = result.rows.map(row => {
    const dateStr = row[0] ? format(toZonedTime(row[0], "America/New_York"), "yyyy-MM-dd") : row[0];
    return [dateStr, row[1], row[2], row[3], row[4], row[5], row[6]] as [string, number, number, number, number, number, number];
  });

  return JSON.stringify(formattedRows);
}

const description =
  "Fetch historical daily price data for a symbol. To use this API correctly, request a date range 1 day ahead and 1 day behind the date you are looking for";

const inputSchema = z.object({
  symbol: z.string().describe("Ticker symbol."),
  from: z.string().describe("Start date (YYYY-MM-DD). Must be at least 1 day before date requested").exactOptional(),
  to: z.string().describe("End date (YYYY-MM-DD). Must be at least 1 day after date requested").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
