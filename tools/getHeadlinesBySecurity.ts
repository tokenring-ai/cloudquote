import Agent from "@tokenring-ai/agent/Agent";
import {TokenRingToolDefinition} from "@tokenring-ai/chat/types";
import {z} from "zod";
import CloudQuoteService from "../CloudQuoteService.ts";

const name = "cloudquote_getHeadlinesBySecurity";

async function execute(
  {symbols, start, count, minDate, maxDate}: z.infer<typeof inputSchema>,
  agent: Agent,
): Promise<any> {
  const cloudQuoteService = agent.requireServiceByType(CloudQuoteService);
  if (! symbols) {
    throw new Error("symbols is required");
  }
  const { rows } =  await cloudQuoteService.getJSON('fcon/getHeadlinesBySecurity', {symbols, start, count, minDate, maxDate});
  for (let row of rows) {
    if (row.bodyId) row.link = `https://www.financialcontent.com/article/${row.slug}`;
  }

  return rows;
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
  name, description, inputSchema, execute,
} satisfies TokenRingToolDefinition<typeof inputSchema>;