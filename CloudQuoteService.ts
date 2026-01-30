import {TokenRingService} from "@tokenring-ai/app/types";
import {doFetchWithRetry} from "@tokenring-ai/utility/http/doFetchWithRetry";
import {HttpService} from "@tokenring-ai/utility/http/HttpService";
import {z} from "zod";

export class CloudQuoteError extends Error {
  constructor(public readonly cause: unknown, message: string) {
    super(message);
    this.name = "CloudQuoteError";
  }
}

export default class CloudQuoteService extends HttpService implements TokenRingService {
  name = "CloudQuote";
  description = "Service for accessing CloudQuote financial data API";

  protected baseUrl = "https://api.cloudquote.io";
  protected defaultHeaders: Record<string, string>;
  private readonly timeout = 10_000;

  constructor(private readonly options: CloudQuoteServiceOptions) {
    super();
    this.defaultHeaders = {
      'Authorization': `privateKey ${this.options.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async getHeadlinesBySecurity(params: any) {
    try {
      // This uses a different base URL, so we need to handle it separately
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await doFetchWithRetry(
        "http://api.investcenter.newsrpm.com:16016/search/indexedData",
        {
          method: 'POST',
          headers: {
            'Authorization': this.options.apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(params),
          signal: controller.signal
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        throw new CloudQuoteError(errorData, `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      if (err instanceof CloudQuoteError) throw err;
      throw new CloudQuoteError(err, 'Failed to get headlines by security');
    }
  }

  async getJSON(apiPath: string, params: Record<string, string|number|undefined|null>) {
    return this.request<any>(apiPath, params);
  }


  async getPriceChart(params: any) {
    const { symbol, interval } = params;
    const uri = `https://chart.financialcontent.com/Chart?shwidth=3&fillshx=0&height=200&lncolor=2466BA&interval=${interval}&fillshy=0&gtcolor=2466BA&vucolor=008000&bvcolor=FFFFFF&gmcolor=DDDDDD&shcolor=BBBBBB&grcolor=FFFFFF&vdcolor=FF0000&brcolor=FFFFFF&gbcolor=FFFFFF&lnwidth=2&volume=0&pvcolor=B50000&mkcolor=CD5252&itcolor=666666&fillalpha=0&ticker=${symbol}&Client=stocks&txcolor=BBBBBB&output=svg&bgcolor=FFFFFF&arcolor=null&type=0&width=375`;
    return { svgDataUri: uri };
  }

  private async request<T>(path: string, params?: Record<string, any>, options?: { method?: string; body?: any }): Promise<T> {
    try {
      const queryParams = new URLSearchParams();
      if (params) {
        const filtered = Object.fromEntries(
          Object.entries(params).filter(([, v]) => v != null)
        );
        Object.entries(filtered).forEach(([key, value]) => {
          queryParams.set(key, String(value));
        });
      }

      const pathWithQuery = `/${path}.json${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      return await this.fetchJson(pathWithQuery, {
        method: options?.method || 'GET',
        body: options?.body ? JSON.stringify(options.body) : undefined,
      }, `CloudQuote ${path}`);
    } catch (err: any) {
      if (err.status) {
        throw new CloudQuoteError(err.details, `HTTP ${err.status}: ${err.message}`);
      }
      throw new CloudQuoteError(err, `Failed request to ${path}`);
    }
  }
}
export const CloudQuoteServiceOptionsSchema = z.object({
  apiKey: z.string(),
});
export type CloudQuoteServiceOptions = z.infer<typeof CloudQuoteServiceOptionsSchema>;
