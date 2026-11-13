import type TokenRingApp from "@tokenring-ai/app";
import type { TokenRingService } from "@tokenring-ai/app/types";
import { NewsRPMService } from "@tokenring-ai/newsrpm";
import formatError from "@tokenring-ai/utility/error/formatError";
import { type FetchJSONOpts, HTTPError, HTTPRetriever } from "@tokenring-ai/utility/http/HTTPRetriever";
import type { z } from "zod";
import {
  CloudQuoteFindStockResponseSchema,
  type CloudQuoteHeadlinesBySecurityParams,
  CloudQuoteLeadersResponseSchema,
  CloudQuotePriceHistoryResponseSchema,
  CloudQuotePriceTicksResponseSchema,
  CloudQuoteQuoteResponseSchema,
  type ResolvedCloudQuoteServiceOptions,
} from "./schema.ts";

export class CloudQuoteError extends Error {
  constructor(
    public readonly cause: unknown,
    message: string,
  ) {
    super(message);
    this.name = "CloudQuoteError";
  }
}

export default class CloudQuoteService implements TokenRingService {
  readonly name = "CloudQuote";
  description = "Service for accessing CloudQuote financial data API";

  private retriever: HTTPRetriever;
  private options: ResolvedCloudQuoteServiceOptions;

  constructor(
    private readonly app: TokenRingApp,
    options?: ResolvedCloudQuoteServiceOptions,
  ) {
    this.options = options ?? { apiKey: "" };
    this.retriever = this.createRetriever();
  }

  reconfigure(options: ResolvedCloudQuoteServiceOptions): void {
    this.options = options;
    this.retriever = this.createRetriever();
  }

  /** Whether an API key has been resolved; every request fails without one. */
  isConfigured(): boolean {
    return this.options.apiKey.trim().length > 0;
  }

  private createRetriever(): HTTPRetriever {
    return new HTTPRetriever({
      baseUrl: "https://api.cloudquote.io",
      headers: {
        Authorization: `privateKey ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    });
  }

  /**
   * Ticker headlines live in NewsRPM's NormalizedTicker index. Call that search
   * rather than posting `{symbols, count}` at the NewsRPM origin.
   */
  async getHeadlinesBySecurity(params: CloudQuoteHeadlinesBySecurityParams) {
    try {
      return await this.app.requireService(NewsRPMService).searchIndexedData(indexedSearchForHeadlines(params));
    } catch (err) {
      this.app.serviceError(this, "CloudQuote headlines by security failed", err);
      if (err instanceof CloudQuoteError) throw err;
      if (err instanceof HTTPError) {
        throw new CloudQuoteError(err.details, `HTTP ${err.status}: ${err.message}`);
      }
      throw new CloudQuoteError(err, "Failed to get headlines by security");
    }
  }

  getJSON(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request(apiPath, params, CloudQuoteQuoteResponseSchema);
  }

  getQuote(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request(apiPath, params, CloudQuoteQuoteResponseSchema);
  }

  getPriceHistory(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request(apiPath, params, CloudQuotePriceHistoryResponseSchema);
  }

  getPriceTicks(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request(apiPath, params, CloudQuotePriceTicksResponseSchema);
  }

  getLeaders(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request(apiPath, params, CloudQuoteLeadersResponseSchema);
  }

  findStock(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request(apiPath, params, CloudQuoteFindStockResponseSchema);
  }

  private async request<S extends z.ZodType>(
    path: string,
    params: Record<string, string | number | undefined | null> | undefined,
    schema: S,
    options?: { method?: string | undefined; body?: unknown },
  ): Promise<z.output<S>> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
        Object.entries(filtered).forEach(([key, value]) => {
          queryParams.set(key, String(value));
        });
      }

      queryParams.set("T", this.options.apiKey);

      // The query string carries the API key (`T`), so the log copy redacts it;
      // the fetch itself keeps the real query params.
      const loggedParams = new URLSearchParams(queryParams);
      if (loggedParams.has("T")) loggedParams.set("T", "***redacted***");
      this.app.serviceOutput(this, `CloudQuote RPC: ${path}.json?${loggedParams.toString()}`);

      const opts: NonNullable<FetchJSONOpts["opts"]> = {
        method: options?.method || "GET",
        credentials: "include",
        ...(options?.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      };

      return await this.retriever.fetchValidatedJson({
        url: `${path}.json?${queryParams.toString()}`,
        opts,
        context: `CloudQuote ${path}`,
        schema,
      });
    } catch (err) {
      this.app.serviceError(this, `CloudQuote RPC failed: ${path}`, err);

      if (err instanceof HTTPError) {
        throw new CloudQuoteError(err.details, `HTTP ${err.status}: ${err.message}`);
      }

      throw new CloudQuoteError(err, `Failed request to ${path}, ${formatError(err)}`);
    }
  }
}

/** Map a headlines query onto the indexed-data search the rest of the app uses. */
function indexedSearchForHeadlines(params: CloudQuoteHeadlinesBySecurityParams) {
  const symbols = params.symbols
    .split(",")
    .map(symbol => symbol.trim().toUpperCase())
    .filter(symbol => symbol.length > 0);
  const minDate = parseOptionalTime(params.minDate);
  const maxDate = parseOptionalTime(params.maxDate);
  return {
    key: "NormalizedTicker",
    ...(symbols.length > 1 ? { value: symbols } : symbols[0] ? { value: symbols[0] } : {}),
    ...(params.count !== undefined ? { count: params.count } : {}),
    ...(params.start !== undefined ? { offset: params.start } : {}),
    ...(minDate !== undefined ? { minDate } : {}),
    ...(maxDate !== undefined ? { maxDate } : {}),
    order: "date" as const,
  };
}

function parseOptionalTime(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
}
