import { useNewsRPMIndexedDataSearchResults, useStockHeadlines } from "@tokenring-ai/one-frontend/rpc.ts";
import { useMemo } from "react";
import { parseHistoryDate } from "./formatters.ts";
import type { StockNewsItem } from "./types.ts";

export interface StockNewsArticle {
  key: string;
  headline: string;
  date: string;
  provider: string;
  link: string;
  /** Present when the full article body can be fetched via NewsRPM renderBody. */
  bodyId?: string;
}

function formatNewsDate(raw: string | number | null | undefined): string {
  if (raw == null || raw === "") return "";
  if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const ts = typeof raw === "number" ? parseHistoryDate(raw) : Date.parse(raw);
  if (!ts || Number.isNaN(ts)) return typeof raw === "string" ? raw.slice(0, 10) : "";
  return new Date(ts).toLocaleDateString("en-CA");
}

function normalizeItem(item: StockNewsItem | Record<string, unknown>): StockNewsArticle {
  const row = item as StockNewsItem & { bodyId?: string; BodyId?: string };
  const slug = row.slug ?? row.Slug ?? "";
  const headline = row.headline ?? row.Headline ?? row.title ?? "(no headline)";
  const date = formatNewsDate(row.date ?? row.Date ?? row.publishDate);
  const provider = row.provider ?? row.Provider ?? row.source ?? "";
  const link = slug ? `https://www.financialcontent.com/article/${slug}` : (row.link ?? row.Link ?? "");
  return {
    key: slug || `${headline}-${date}-${provider}`,
    headline,
    date,
    provider,
    link,
    ...((row.bodyId ?? row.BodyId) ? { bodyId: row.bodyId ?? row.BodyId } : {}),
  };
}

/**
 * News for one symbol. NewsRPM tags tickers under NormalizedTicker — a CloudQuote
 * SymbolID is not an index key, and a failed lookup must not skip the ticker query.
 * When that search is empty, fall back to CloudQuote getHeadlinesBySecurity.
 */
export function useStockNews(symbol: string): {
  articles: StockNewsArticle[];
  isLoading: boolean;
  error?: unknown;
} {
  const upper = symbol.trim().toUpperCase();

  const byTicker = useNewsRPMIndexedDataSearchResults(
    upper
      ? {
          key: "NormalizedTicker",
          value: upper,
          count: 30,
          order: "date",
        }
      : undefined,
  );

  const tickerPending = Boolean(upper) && byTicker.isLoading;
  const tickerEmpty = !byTicker.data?.rows.length;
  const headlines = useStockHeadlines(!tickerPending && tickerEmpty && upper ? upper : undefined, 25);

  return useMemo(() => {
    let rows: StockNewsItem[] = [];
    if (byTicker.data?.rows.length) rows = byTicker.data.rows as StockNewsItem[];
    else {
      const raw: unknown = headlines.data?.data;
      if (Array.isArray(raw)) rows = raw as StockNewsItem[];
      else if (raw && typeof raw === "object" && Array.isArray((raw as { rows?: unknown }).rows)) {
        rows = (raw as { rows: StockNewsItem[] }).rows;
      }
    }
    const articles = rows.map(normalizeItem);
    return {
      articles,
      isLoading: byTicker.isLoading || headlines.isLoading,
      error: articles.length ? undefined : byTicker.error || headlines.error,
    };
  }, [byTicker.data, byTicker.isLoading, byTicker.error, headlines.data, headlines.isLoading, headlines.error]);
}
