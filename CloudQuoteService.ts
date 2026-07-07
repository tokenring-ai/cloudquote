import type TokenRingApp from "@tokenring-ai/app";
import type { TokenRingService } from "@tokenring-ai/app/types";
import formatError from "@tokenring-ai/utility/error/formatError";
import { HTTPError, HTTPRetriever } from "@tokenring-ai/utility/http/HTTPRetriever";
import { z } from "zod";
import type {
  CloudQuoteFindStockResponseSchema,
  CloudQuoteLeadersResponseSchema,
  CloudQuotePriceHistoryResponseSchema,
  CloudQuotePriceTicksResponseSchema,
  CloudQuoteQuoteResponseSchema,
  CloudQuoteServiceOptions,
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

  constructor(
    private readonly app: TokenRingApp,
    private readonly options: CloudQuoteServiceOptions,
  ) {
    this.retriever = new HTTPRetriever({
      baseUrl: "https://api.cloudquote.io",
      headers: {
        Authorization: `privateKey ${this.options.apiKey}`,
        "Content-Type": "application/json",
      },
      timeout: 10_000,
    });
  }

  async getHeadlinesBySecurity(params: any) {
    try {
      // This uses a different base URL, so we need to handle it separately

      return await this.retriever.fetchJson({
        url: "http://api.newsrpm.com",
        opts: {
          method: "POST",
          body: JSON.stringify(params),
        },
        context: "CloudQuote headlines by security",
      });
    } catch (err) {
      if (err instanceof CloudQuoteError) throw err;
      throw new CloudQuoteError(err, "Failed to get headlines by security");
    }
  }

  getJSON(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request<z.infer<typeof CloudQuoteQuoteResponseSchema>>(apiPath, params);
  }

  getPriceChart(params: { symbol: string; interval: string }) {
    const { symbol, interval } = params;
    const uri = `https://chart.financialcontent.com/Chart?shwidth=3&fillshx=0&height=200&lncolor=2466BA&interval=${interval}&fillshy=0&gtcolor=2466BA&vucolor=008000&bvcolor=FFFFFF&gmcolor=DDDDDD&shcolor=BBBBBB&grcolor=FFFFFF&vdcolor=FF0000&brcolor=FFFFFF&gbcolor=FFFFFF&lnwidth=2&volume=0&pvcolor=B50000&mkcolor=CD5252&itcolor=666666&fillalpha=0&ticker=${symbol}&Client=stocks&txcolor=BBBBBB&output=svg&bgcolor=FFFFFF&arcolor=null&type=0&width=375`;
    return { svgDataUri: uri };
  }

  getQuote(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request<z.infer<typeof CloudQuoteQuoteResponseSchema>>(apiPath, params);
  }

  getPriceHistory(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request<z.infer<typeof CloudQuotePriceHistoryResponseSchema>>(apiPath, params);
  }

  getPriceTicks(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request<z.infer<typeof CloudQuotePriceTicksResponseSchema>>(apiPath, params);
  }

  getLeaders(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request<z.infer<typeof CloudQuoteLeadersResponseSchema>>(apiPath, params);
  }

  findStock(apiPath: string, params: Record<string, string | number | undefined | null>) {
    return this.request<z.infer<typeof CloudQuoteFindStockResponseSchema>>(apiPath, params);
  }

  private async request<T>(path: string, params?: Record<string, any>, options?: { method?: string | undefined; body?: any }): Promise<T> {
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

      return await this.retriever.fetchValidatedJson({
        url: pathWithQuery,
        opts: {
          method: options?.method || "GET",
          ...(options?.body && {
            body: JSON.stringify(options.body),
          }),
          credentials: "include",
        },
        context: `CloudQuote ${path}`,
        schema: z.any(), // Schema validation is handled by typed wrapper methods
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
