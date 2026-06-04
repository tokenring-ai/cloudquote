import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getLeaders";
const displayName = "Cloudquote/getLeaders";

async function execute({ list, type, limit, minPrice, maxPrice }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  if (!list) {
    throw new Error("list is required");
  }

  const result = await cloudQuoteService.getLeaders("fcon/getLeaders", {
    list,
    type,
    limit,
    minPrice,
    maxPrice,
  });
  if (!result || !Array.isArray(result.rows)) {
    throw new Error("Invalid response from getLeaders API");
  }

  return JSON.stringify(result.rows);
}

const description =
  "Get a list of stocks that are notable today (most active by volume, highest percent gainers, biggest percent losers, or most popular stocks).";

const inputSchema = z.object({
  list: z.enum(["MOSTACTIVE", "PERCENTGAINERS", "PERCENTLOSERS"]).describe("Type of list."),
  type: z.enum(["STOCK", "ETF"]).describe("Security type.").exactOptional(),
  limit: z.number().int().min(1).max(50).describe("Max number of results.").exactOptional(),
  minPrice: z.number().exactOptional(),
  maxPrice: z.number().exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
