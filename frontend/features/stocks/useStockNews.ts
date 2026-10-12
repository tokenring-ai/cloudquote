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
 * News for one symbol: NewsRPM ticker-tagged search (by SymbolID, then by
 * normalized ticker), falling back to CloudQuote's headlines endpoint only
 * when both come back empty.
 */
export function useStockNews(
  symbol: string,
  symbolId?: string,
): {
  articles: StockNewsArticle[];
  isLoading: boolean;
  error?: unknown;
} {
  const upper = symbol.toUpperCase();

  const byId = useNewsRPMIndexedDataSearchResults(
    symbolId
      ? {
          key: "symbolID",
          value: symbolId,
          count: 30,
          order: "date",
        }
      : undefined,
  );

  const byTicker = useNewsRPMIndexedDataSearchResults(
    !symbolId || (byId.data && !byId.data.rows.length)
      ? {
          key: "NormalizedTicker",
          value: upper,
          count: 30,
          order: "date",
        }
      : undefined,
  );

  const primaryPending = Boolean(symbolId && byId.isLoading) || byTicker.isLoading;
  const primaryEmpty = !byId.data?.rows.length && !byTicker.data?.rows.length;
  const headlines = useStockHeadlines(!primaryPending && primaryEmpty ? upper : undefined, 25);

  return useMemo(() => {
    let rows: StockNewsItem[] = [];
    if (byId.data?.rows.length) rows = byId.data.rows as StockNewsItem[];
    else if (byTicker.data?.rows.length) rows = byTicker.data.rows as StockNewsItem[];
    else {
      const raw: unknown = headlines.data?.data;
      if (Array.isArray(raw)) rows = raw as StockNewsItem[];
      else if (raw && typeof raw === "object" && Array.isArray((raw as { rows?: unknown }).rows)) {
        rows = (raw as { rows: StockNewsItem[] }).rows;
      }
    }
    return {
      articles: rows.map(normalizeItem),
      isLoading: byId.isLoading || byTicker.isLoading || headlines.isLoading,
      error: byId.error || byTicker.error || headlines.error,
    };
  }, [byId.data, byId.isLoading, byId.error, byTicker.data, byTicker.isLoading, byTicker.error, headlines.data, headlines.isLoading, headlines.error]);
}
