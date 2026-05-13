import type Agent from "@tokenring-ai/agent/Agent";
import type { TokenRingToolDefinition, TokenRingToolResult } from "@tokenring-ai/chat/schema";
import { z } from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getHeadlinesBySecurity";
const displayName = "Cloudquote/getHeadlinesBySecurity";

async function execute({ symbols, start, count, minDate, maxDate }: z.output<typeof inputSchema>, agent: Agent): Promise<TokenRingToolResult> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  if (!symbols) {
    throw new Error("symbols is required");
  }
  // Note: This calls the service method which uses NewsRPM API (http://api.newsrpm.com)
  const result = (await cloudQuoteService.getHeadlinesBySecurity({
    symbols,
    start,
    count,
    minDate,
    maxDate,
  })) as any;
  if (!result || !Array.isArray(result.rows)) {
    throw new Error("Invalid response from getHeadlinesBySecurity API");
  }

  const rows = result.rows as any[];
  for (const row of rows) {
    if (row.bodyId && row.slug) {
      row.link = `https://www.financialcontent.com/article/${row.slug}`;
    }
  }

  return JSON.stringify(rows);
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
