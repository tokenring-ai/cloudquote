import EmptyState from "@tokenring-ai/one-frontend/components/ui/EmptyState.tsx";
import ErrorState from "@tokenring-ai/one-frontend/components/ui/ErrorState.tsx";
import ListItemWithActions from "@tokenring-ai/one-frontend/components/ui/ListItemWithActions.tsx";
import LoadingState from "@tokenring-ai/one-frontend/components/ui/LoadingState.tsx";
import ViewHeader from "@tokenring-ai/one-frontend/components/ui/ViewHeader.tsx";
import ViewShell from "@tokenring-ai/one-frontend/components/ui/ViewShell.tsx";
import type { ViewProps } from "@tokenring-ai/one-frontend/dock/types.ts";
import { newsrpmRPCClient, useStockQuotesStream, useTypedSWR } from "@tokenring-ai/one-frontend/rpc.ts";
import { ArrowLeft, ExternalLink, Newspaper } from "lucide-react";
import { useState } from "react";
import { type StockNewsArticle, useStockNews } from "../features/stocks/useStockNews.ts";
import type { SymbolParams } from "../lib/stocksShared.ts";
import { STOCKS_DASHBOARD_ID } from "../manifest.ts";

/**
 * Per-symbol news. Headlines come from NewsRPM's ticker-tagged search (with
 * CloudQuote headlines as the last resort); articles with a bodyId open in an
 * in-app reader, the rest link out.
 */
export default function StocksNewsView({ params }: ViewProps<SymbolParams>) {
  const [selected, setSelected] = useState<StockNewsArticle | null>(null);
  const quotes = useStockQuotesStream([params.symbol]);
  const symbolId = quotes.data?.rows[0]?.SymbolID;
  const news = useStockNews(params.symbol, symbolId);

  return (
    <ViewShell
      scroll={false}
      header={
        <ViewHeader
          variant="panel"
          dashboardId={STOCKS_DASHBOARD_ID}
          title={`News · ${params.symbol}`}
          actions={
            selected
              ? [
                  {
                    key: "back",
                    icon: <ArrowLeft className="w-3.5 h-3.5" />,
                    label: "All headlines",
                    title: "Back to headlines",
                    onClick: () => setSelected(null),
                  },
                ]
              : []
          }
        />
      }
    >
      {selected ? (
        <ArticleReader article={selected} />
      ) : news.isLoading ? (
        <LoadingState size="sm" className="py-8" />
      ) : news.error && !news.articles.length ? (
        <ErrorState error={news.error} title={`Failed to load news for ${params.symbol}`} variant="page" className="py-8" />
      ) : news.articles.length === 0 ? (
        <EmptyState icon={Newspaper} title={`No news for ${params.symbol}`} variant="page" className="py-8" />
      ) : (
        <div className="h-full min-h-0 overflow-y-auto space-y-2 pr-1" data-testid="stocks-news-list">
          {news.articles.map((article, i) => (
            <ListItemWithActions
              key={article.key || i}
              id={article.key || String(i)}
              onPrimary={() => {
                // Full text opens in the reader; everything else goes to the source.
                if (article.bodyId) setSelected(article);
                else if (article.link) window.open(article.link, "_blank", "noopener,noreferrer");
                else setSelected(article);
              }}
              primaryProps={{
                title: article.bodyId ? "Read article" : "Open at source",
                "aria-label": `${article.bodyId ? "Read" : "Open at source"}: ${article.headline}`,
              }}
              className="items-start gap-3 px-4 py-3 rounded-xl bg-secondary border border-primary hover:border-accent-muted"
              action={
                article.link ? (
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-muted hover:text-accent-soft transition-all rounded-md focus-ring cursor-pointer"
                    aria-label={`Open article externally: ${article.headline}`}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : undefined
              }
            >
              <span className="flex items-start gap-3 min-w-0">
                <Newspaper className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-primary leading-snug mb-1">{article.headline}</span>
                  <span className="flex items-center gap-3">
                    {article.provider && <span className="text-xs text-muted">{article.provider}</span>}
                    {article.date && <span className="text-xs text-muted font-mono">{article.date}</span>}
                    {article.bodyId && <span className="text-[10px] uppercase tracking-wide text-accent-soft">Full text</span>}
                  </span>
                </span>
              </span>
            </ListItemWithActions>
          ))}
        </div>
      )}
    </ViewShell>
  );
}

/** HTML arrives tagged "html" or as the feed's "native" format — the content itself is the reliable signal. */
function isHtmlChunk(chunk: { format: string; content: string }): boolean {
  return chunk.format.toLowerCase().includes("html") || /^\s*</.test(chunk.content);
}

/**
 * In-app article reader: NewsRPM's rendered HTML is shown in a sandboxed frame
 * (no scripts, no same-origin access — same containment as the email viewer).
 * Articles without a usable body send the reader back to the source.
 */
function ArticleReader({ article }: { article: StockNewsArticle }) {
  const body = useTypedSWR(article.bodyId ? `newsrpm:renderBody/${article.bodyId}` : null, () => newsrpmRPCClient.renderBody({ bodyId: article.bodyId! }));

  const chunks = body.data?.body.chunks ?? [];
  const html = chunks
    .filter(isHtmlChunk)
    .map(chunk => chunk.content)
    .join("\n");
  const text = html
    ? ""
    : chunks
        .filter(chunk => !isHtmlChunk(chunk))
        .map(chunk => chunk.content)
        .join("\n\n");

  if (body.isLoading) return <LoadingState size="sm" className="py-8" />;
  if (body.error && !html && !text) {
    return <ErrorState error={body.error} title="Failed to load the article body" onRetry={() => void body.mutate()} variant="page" className="py-8" />;
  }

  if (!html && !text) {
    return (
      <div className="h-full min-h-0 flex flex-col" data-testid="stocks-news-reader">
        <ReaderHeader article={article} />
        <div className="flex-1 min-h-0 grid place-items-center p-4">
          <EmptyState
            icon={ExternalLink}
            title="No full text available"
            hint={article.link ? "This article can be read at its source." : "Neither a body nor a source link is available for this article."}
            variant="page"
            {...(article.link
              ? { ctaLabel: "Open at source", ctaIcon: ExternalLink, onCta: () => window.open(article.link!, "_blank", "noopener,noreferrer") }
              : {})}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col" data-testid="stocks-news-reader">
      <ReaderHeader article={article} />
      <div className="flex-1 min-h-0 p-3">
        {html ? (
          <iframe
            srcDoc={articleFrameDocument(html)}
            className="w-full h-full rounded-xl border border-primary bg-white shadow-card"
            style={{ colorScheme: "light" }}
            sandbox=""
            title={`Article: ${article.headline}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full overflow-y-auto rounded-xl border border-primary bg-secondary p-5 text-sm leading-relaxed text-secondary whitespace-pre-wrap max-w-3xl mx-auto">
            {text}
          </div>
        )}
      </div>
    </div>
  );
}

/** Page styling for the sandboxed article frame: a centered reading column with themed typography. */
function articleFrameDocument(html: string): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body { margin: 0; background: #fff; color: #334155; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 15px; line-height: 1.7; }
    .article { max-width: 44rem; margin: 0 auto; padding: 24px 28px 40px; }
    h1, h2, h3, h4 { color: #0f172a; line-height: 1.3; margin: 1.4em 0 0.5em; }
    h1 { font-size: 1.35em; } h2 { font-size: 1.2em; } h3 { font-size: 1.05em; }
    p { margin: 0.9em 0; }
    img { max-width: 100%; height: auto; border-radius: 8px; }
    a { color: #0d9488; }
    blockquote { margin: 1em 0; padding: 0.2em 1em; border-left: 3px solid #cbd5e1; color: #64748b; }
    table { max-width: 100%; border-collapse: collapse; }
    pre { overflow-x: auto; }
  </style></head><body><div class="article">${html}</div></body></html>`;
}

function ReaderHeader({ article }: { article: StockNewsArticle }) {
  return (
    <header className="shrink-0 px-4 py-3 border-b border-primary bg-secondary/60 space-y-1.5">
      <h2 className="text-sm font-semibold text-primary leading-snug">{article.headline}</h2>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
        {article.provider && <span className="px-1.5 py-0.5 rounded-md bg-primary border border-primary font-medium text-secondary">{article.provider}</span>}
        {article.date && <span className="font-mono">{article.date}</span>}
        {article.link && (
          <a href={article.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-accent-soft transition-colors">
            Source <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </header>
  );
}
