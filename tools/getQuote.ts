import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition, type TokenRingToolJSONResult} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getQuote";
const displayName = "Cloudquote/getQuote";

async function execute(
  {symbols}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolJSONResult<any>> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  if (!symbols || symbols.length === 0) {
    throw new Error("symbols array is required and cannot be empty");
  }
  return { type: 'json', data: await cloudQuoteService.getJSON('fcon/getQuote', {symbol: symbols.join(",")})};
}

const description = "Retrieve pricing and metadata for given security symbols.";

const inputSchema = z.object({
  symbols: z.array(z.string()).describe("Array of ticker symbols to fetch (e.g. ['AAPL', 'GOOGL', 'MSFT'])."),
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;