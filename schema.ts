import z from "zod";

export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});

export type CloudQuoteServiceOptions = z.infer<typeof CloudQuoteServiceOptionsSchema>;