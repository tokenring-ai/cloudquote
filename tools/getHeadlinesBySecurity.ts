import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { ToolCallError } from "@tokenring-ai/chat/util/tokenRingTool";
import { z } from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getHeadlinesBySecurity";
const displayName = "Cloudquote/getHeadlinesBySecurity";

async function execute({ symbols, start, count, minDate, maxDate }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  if (!symbols) {
    throw new ToolCallError(name, "symbols is required");
  }
  // Note: This calls the service method which uses NewsRPM API (http://api.newsrpm.com)
  const result = await cloudQuoteService.getHeadlinesBySecurity({
    symbols,
    start,
    count,
    minDate,
    maxDate,
  });

  ((result as any).rows ?? [])?.forEach((row: any) => {
    if (row.bodyId && row.slug) {
      row.link = `https://www.financialcontent.com/article/${row.slug}`;
    }
  });

  return {
    message: `**CloudQuote** Retrieved ${((result as any).rows)?.length ?? 0} headlines for ${symbols}`,
    result: JSON.stringify(result),
  };
}

const description = "Retrieve news headlines for one or more ticker symbols within a specified time range.";

const inputSchema = z.object({
  symbols: z.string().describe("Comma-separated ticker symbols (e.g., 'GOOG,AAPL')."),
  start: z.number().int().min(0).describe("Number of records to skip before returning results.").exactOptional(),
  count: z.number().int().min(1).max(100).describe("Number of records to retrieve (max 100).").exactOptional(),
  minDate: z.string().describe("Article publication date-time (ISO 8601) for start of date-time range.").exactOptional(),
  maxDate: z.string().describe("Article publication date-time (ISO 8601) for start of date-time range.").exactOptional(),
});

export default {
  name,
  displayName,
  description,
  inputSchema,
  execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;
