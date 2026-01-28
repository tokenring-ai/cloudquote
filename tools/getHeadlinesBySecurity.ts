import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition, type TokenRingToolJSONResult} from "@tokenring-ai/chat/schema";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getHeadlinesBySecurity";
const displayName = "Cloudquote/getHeadlinesBySecurity";

async function execute(
  {symbols, start, count, minDate, maxDate}: z.output<typeof inputSchema>,
  agent: Agent,
): Promise<TokenRingToolJSONResult<any>> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  if (! symbols) {
    throw new Error("symbols is required");
  }
  const { rows } =  await cloudQuoteService.getJSON('fcon/getHeadlinesBySecurity', {symbols, start, count, minDate, maxDate});
  for (let row of rows) {
    if (row.bodyId) row.link = `https://www.financialcontent.com/article/${row.slug}`;
  }

  return { type: 'json', data: rows };
}

const description = "Retrieve news headlines for one or more ticker symbols within a specified time range.";

const inputSchema = z.object({
  symbols: z.string().describe("Comma-separated ticker symbols (e.g., 'GOOG,AAPL')."),
  start: z.number().int().min(0).describe("Number of records to skip before returning results.").optional(),
  count: z.number().int().min(1).max(100).describe("Number of records to retrieve (max 100).").optional(),
  minDate: z.string().describe("Article publication date-time (ISO 8601) for start of date-time range.").optional(),
  maxDate: z.string().describe("Article publication date-time (ISO 8601) for start of date-time range.").optional(),
});

export default {
  name, displayName, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;