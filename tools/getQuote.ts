import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getQuote";

async function execute(
  {symbols}: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<any> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  if (!symbols || symbols.length === 0) {
    throw new Error("symbols array is required and cannot be empty");
  }
  return await cloudQuoteService.getJSON('fcon/getQuote', {symbol: symbols.join(",")});
}

const description = "Retrieve pricing and metadata for given security symbols.";

const inputSchema = z.object({
  symbols: z.array(z.string()).describe("Array of ticker symbols to fetch (e.g. ['AAPL', 'GOOGL', 'MSFT'])."),
});

export default {
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;