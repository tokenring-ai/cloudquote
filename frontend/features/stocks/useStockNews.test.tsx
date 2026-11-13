import { beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook } from "@testing-library/react";

type IndexedSearch = { key: string; value?: string | string[]; count?: number; order?: string } | undefined;

const indexedSearches: IndexedSearch[] = [];
const headlineSymbols: Array<string | undefined> = [];

let tickerState: { data?: { rows: Record<string, unknown>[] }; isLoading: boolean; error?: unknown };
let headlineState: { data?: { data: unknown }; isLoading: boolean; error?: unknown };

void mock.module("@tokenring-ai/one-frontend/rpc.ts", () => ({
  useNewsRPMIndexedDataSearchResults: (search: IndexedSearch) => {
    indexedSearches.push(search);
    return { ...tickerState, mutate: mock(async () => undefined) };
  },
  // useStockHeadlines is the app's client for cloudquoteRPCClient.getHeadlinesBySecurity.
  useStockHeadlines: (symbols: string | undefined, count = 25) => {
    headlineSymbols.push(symbols);
    return { ...headlineState, count, mutate: mock(async () => undefined) };
  },
}));

const { useStockNews } = await import("./useStockNews.ts");

beforeEach(() => {
  indexedSearches.length = 0;
  headlineSymbols.length = 0;
  tickerState = { isLoading: false };
  headlineState = { isLoading: false };
});

describe("useStockNews", () => {
  it("queries NormalizedTicker and does not query a symbolID index", () => {
    tickerState = {
      isLoading: false,
      data: { rows: [{ slug: "aapl-1", headline: "Apple beats", date: "2024-01-02", provider: "TestNews", bodyId: "body-1" }] },
    };

    const { result } = renderHook(() => useStockNews("aapl"));

    expect(indexedSearches).toContainEqual({ key: "NormalizedTicker", value: "AAPL", count: 30, order: "date" });
    expect(indexedSearches.some(search => search?.key === "symbolID")).toBe(false);
    expect(headlineSymbols.every(symbols => symbols === undefined)).toBe(true);
    expect(result.current.articles[0]).toMatchObject({ headline: "Apple beats", bodyId: "body-1", provider: "TestNews" });
    expect(result.current.isLoading).toBe(false);
  });

  it("still queries NormalizedTicker while a ticker lookup is in flight, and does not fall back yet", () => {
    tickerState = { isLoading: true };

    renderHook(() => useStockNews("AAPL"));

    expect(indexedSearches).toContainEqual({ key: "NormalizedTicker", value: "AAPL", count: 30, order: "date" });
    expect(headlineSymbols.every(symbols => symbols === undefined)).toBe(true);
  });

  it("falls back through getHeadlinesBySecurity when the ticker index is empty or failed", () => {
    tickerState = { isLoading: false, error: new Error("indexed search failed"), data: { rows: [] } };
    headlineState = {
      isLoading: false,
      data: { data: { rows: [{ slug: "wire-1", headline: "Wire headline", date: "2024-03-01", provider: "Wire", bodyId: "body-9" }] } },
    };

    const { result } = renderHook(() => useStockNews("msft"));

    expect(indexedSearches).toContainEqual({ key: "NormalizedTicker", value: "MSFT", count: 30, order: "date" });
    expect(headlineSymbols).toContain("MSFT");
    expect(result.current.articles[0]).toMatchObject({ headline: "Wire headline", bodyId: "body-9" });
    expect(result.current.error).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});
