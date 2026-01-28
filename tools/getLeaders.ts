import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition, type TokenRingToolJSONResult} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getLeaders";
const displayName = "Cloudquote/getLeaders";

async function execute(
  {list, type, limit, minPrice, maxPrice}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolJSONResult<any>> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  if (! list) {
    throw new Error("list is required");
  }

  return { type: 'json', data: await cloudQuoteService.getJSON('fcon/getLeaders', {list, type, limit, minPrice, maxPrice}) };
}

const description = "Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers, or most popular stocks).";

const inputSchema = z.object({
  list: z.enum(["MOSTACTIVE", "PERCENTGAINERS", "PERCENTLOSERS"]).describe("Type of list."),
  type: z.enum(["STOCK", "ETF"]).describe("Security type.").optional(),
  limit: z.number().int().min(1).max(50).describe("Max number of results.").optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional()
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;