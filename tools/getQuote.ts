import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getQuote";
const displayName = "Cloudquote/getQuote";

async function execute({ symbols }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);

  const data = await cloudQuoteService.getQuote("fcon/getQuote", {
    symbol: symbols.join(","),
  });
  return JSON.stringify(data);
}

const description = "Retrieve pricing and metadata for given security symbols.";

const inputSchema = z.object({
  symbols: z.array(z.string()).min(1).describe("Array of ticker symbols to fetch (e.g. ['AAPL', 'GOOGL', 'MSFT'])."),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
