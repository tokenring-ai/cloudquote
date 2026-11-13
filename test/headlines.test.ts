import { afterEach, describe, expect, it } from "bun:test";
import type TokenRingApp from "@tokenring-ai/app";
import { NewsRPMService } from "@tokenring-ai/newsrpm";
import CloudQuoteService from "../CloudQuoteService.ts";
import cloudquoteRPC from "../rpc/cloudquote.ts";
import CloudQuoteRpcSchema from "../rpc/schema.ts";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe("getHeadlinesBySecurity", () => {
  it("searches NewsRPM /search/indexedData by NormalizedTicker instead of posting symbols at the origin", async () => {
    const calls: { url: string; method: string; body: string }[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      calls.push({ url: String(input), method: init?.method ?? "GET", body: String(init?.body ?? "") });
      return new Response(
        JSON.stringify({
          success: true,
          rows: [
            {
              slug: "aapl-1",
              provider: "Wire",
              date: "2024-01-02T00:00:00.000Z",
              headline: "Apple beats",
              type: "News",
              bodyId: "body-1",
            },
          ],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as typeof fetch;

    const news = new NewsRPMService({ apiKey: "news-key", baseUrl: "https://api.newsrpm.com" });
    const required: unknown[] = [];
    let service: CloudQuoteService;
    const app = {
      requireService: (ctor: unknown) => {
        required.push(ctor);
        if (ctor === CloudQuoteService) return service;
        if (ctor === NewsRPMService) return news;
        throw new Error("Unexpected service");
      },
      serviceError: () => {},
    } as unknown as TokenRingApp;
    service = new CloudQuoteService(app, { apiKey: "cloudquote-key" });
    const endpoint = cloudquoteRPC as unknown as {
      methods: Record<string, { execute: (args: { symbols: string; count?: number; start?: number; minDate?: string }, app: TokenRingApp) => Promise<unknown> }>;
    };

    const result = await endpoint.methods.getHeadlinesBySecurity!.execute(
      { symbols: "aapl", count: 25, start: 5, minDate: "2024-01-01T00:00:00.000Z" },
      app,
    );

    expect(required).toContain(NewsRPMService);
    expect(calls).toHaveLength(1);
    const url = new URL(calls[0]!.url);
    expect(`${url.origin}${url.pathname}`).toBe("https://api.newsrpm.com/search/indexedData");
    expect(calls[0]!.method).toBe("POST");
    expect(JSON.parse(calls[0]!.body)).toEqual({
      key: "NormalizedTicker",
      value: "AAPL",
      count: 25,
      offset: 5,
      minDate: Date.parse("2024-01-01T00:00:00.000Z"),
      order: "date",
    });
    expect(JSON.parse(calls[0]!.body)).not.toHaveProperty("symbols");

    const parsed = CloudQuoteRpcSchema.methods.getHeadlinesBySecurity.result.parse(result);
    expect(parsed.data).toMatchObject({ rows: [{ headline: "Apple beats", slug: "aapl-1", bodyId: "body-1" }] });

    await service.getHeadlinesBySecurity({ symbols: "goog, aapl" });
    expect(JSON.parse(calls[1]!.body).value).toEqual(["GOOG", "AAPL"]);
    expect(JSON.parse(calls[1]!.body).key).toBe("NormalizedTicker");
  });
});
