import type TokenRingApp from "@tokenring-ai/app";
import type { TokenRingService } from "@tokenring-ai/app/types";
import formatError from "@tokenring-ai/utility/error/formatError";
import { type FetchJSONOpts, HTTPError, HTTPRetriever } from "@tokenring-ai/utility/http/HTTPRetriever";
import type { z } from "zod";
import {
  CloudQuoteFindStockResponseSchema,
  type CloudQuoteHeadlinesBySecurityParams,
  CloudQuoteHeadlinesResponseSchema,
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

  async getHeadlinesBySecurity(params: CloudQuoteHeadlinesBySecurityParams) {
    try {
      return await this.retriever.fetchValidatedJson({
        url: "https://api.newsrpm.com",
        opts: {
          method: "POST",
          body: JSON.stringify(params),
        },
        context: "CloudQuote headlines by security",
        schema: CloudQuoteHeadlinesResponseSchema,
      });
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

  getPriceChart(params: { symbol: string; interval: string }) {
    const { symbol, interval } = params;
    const uri = `https://chart.financialcontent.com/Chart?shwidth=3&fillshx=0&height=200&lncolor=2466BA&interval=${encodeURIComponent(interval)}&fillshy=0&gtcolor=2466BA&vucolor=008000&bvcolor=FFFFFF&gmcolor=DDDDDD&shcolor=BBBBBB&grcolor=FFFFFF&vdcolor=FF0000&brcolor=FFFFFF&gbcolor=FFFFFF&lnwidth=2&volume=0&pvcolor=B50000&mkcolor=CD5252&itcolor=666666&fillalpha=0&ticker=${encodeURIComponent(symbol)}&Client=stocks&txcolor=BBBBBB&output=svg&bgcolor=FFFFFF&arcolor=null&type=0&width=375`;
    return { svgDataUri: uri };
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

      const pathWithQuery = `${path}.json${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
      this.app.serviceOutput(this, `CloudQuote RPC: ${pathWithQuery}`);

      const opts: NonNullable<FetchJSONOpts["opts"]> = {
        method: options?.method || "GET",
        credentials: "include",
        ...(options?.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      };

      return await this.retriever.fetchValidatedJson({
        url: pathWithQuery,
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
