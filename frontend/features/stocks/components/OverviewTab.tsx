import StatCard from "@tokenring-ai/one-frontend/components/ui/StatCard.tsx";
import { Building2, Clock, DollarSign, Globe } from "lucide-react";
import { changeSign, fmt, fmtMarketCap, fmtPrice, fmtTs, fmtVol } from "../formatters.ts";
import type { StockQuote } from "../types.ts";
import LastTradeTime from "./LastTradeTime.tsx";
import RangeBar from "./RangeBar.tsx";
import StocksLoadError from "./StocksLoadError.tsx";

interface OverviewTabProps {
  quote: StockQuote | undefined;
  quoteLoading?: boolean;
  /** The quote load error, if any; shown (with Retry) only while there is no quote. */
  quoteError?: unknown;
  onRetry?: () => void;
}

function money(n: number | null | undefined): string {
  return n != null && !Number.isNaN(Number(n)) ? `$${fmtPrice(n)}` : "—";
}

/**
 * Ranges, key stats and period performance for one symbol — everything the
 * quote payload carries. The price chart itself lives in the chart card above.
 */
export default function OverviewTab({ quote, quoteLoading, quoteError, onRetry }: OverviewTabProps) {
  if (quoteLoading && !quote) {
    return <div className="py-8 text-center text-muted text-sm">Loading quote…</div>;
  }
  if (quoteError && !quote) {
    return <StocksLoadError title="Failed to load quote" error={quoteError} onRetry={() => onRetry?.()} />;
  }
  if (!quote) return <div className="py-8 text-center text-muted text-sm">No quote data</div>;

  const price = quote.Price;
  // P/E is only meaningful for positive EPS; zero/negative EPS → "—"
  const peRatio = quote.Price != null && quote.EPS != null && quote.EPS > 0 ? quote.Price / quote.EPS : null;
  // Zero dividend is a real value (0%), not missing data
  const dividendYield = quote.AnnualDividend != null && quote.Price != null && quote.Price !== 0 ? (quote.AnnualDividend / quote.Price) * 100 : null;
  const relativeVolume = quote.Volume != null && quote.AverageVolume ? quote.Volume / quote.AverageVolume : null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="px-4 py-3 bg-secondary rounded-xl border border-primary">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs uppercase tracking-wide text-muted">Day Range</span>
            <span className="text-xs text-muted font-mono">
              {money(quote.Low)} – {money(quote.High)}
            </span>
          </div>
          <RangeBar
            low={quote.Low}
            high={quote.High}
            current={price}
            lowLabel={quote.Low != null ? `L ${money(quote.Low)}` : "L —"}
            highLabel={quote.High != null ? `H ${money(quote.High)}` : "H —"}
          />
        </div>
        <div className="px-4 py-3 bg-secondary rounded-xl border border-primary">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs uppercase tracking-wide text-muted">52-Week Range</span>
            <span className="text-xs text-muted font-mono">
              {money(quote.Low52)} – {money(quote.High52)}
            </span>
          </div>
          <RangeBar
            low={quote.Low52}
            high={quote.High52}
            current={price}
            lowLabel={
              quote.Low52 != null ? <span title={quote.Low52Date ? `Low on ${fmtTs(quote.Low52Date)}` : undefined}>L {money(quote.Low52)}</span> : "L —"
            }
            highLabel={
              quote.High52 != null ? <span title={quote.High52Date ? `High on ${fmtTs(quote.High52Date)}` : undefined}>H {money(quote.High52)}</span> : "H —"
            }
          />
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-wide text-muted font-bold mb-2 px-1">Key Stats</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <StatCard label="Open" value={money(quote.Open)} />
          <StatCard label="Prev Close" value={money(quote.PrevClose)} />
          <StatCard label="Volume" value={fmtVol(quote.Volume)} sub={quote.AverageVolume ? `Avg ${fmtVol(quote.AverageVolume)}` : undefined} />
          <StatCard
            label="Rel. Volume"
            value={relativeVolume != null ? `${fmt(relativeVolume)}×` : "—"}
            accent={relativeVolume == null ? "neutral" : relativeVolume >= 1 ? "up" : "down"}
          />
          <StatCard label="Market Cap" value={fmtMarketCap(quote.Price, quote.SharesOutstanding)} />
          <StatCard
            label="P/E Ratio"
            value={peRatio != null ? fmt(peRatio) : "—"}
            sub={quote.EPS != null ? (quote.EPS <= 0 ? `EPS $${fmt(quote.EPS)} (N/M)` : `EPS $${fmt(quote.EPS)}`) : undefined}
          />
          <StatCard
            label="Dividend Yield"
            value={dividendYield != null ? `${fmt(dividendYield)}%` : "—"}
            sub={quote.AnnualDividend != null ? `Annual $${fmt(quote.AnnualDividend)}` : undefined}
          />
          <StatCard
            label="TTM Dividend"
            value={quote.TTMDividend != null ? `$${fmt(quote.TTMDividend)}` : "—"}
            sub={
              quote.LatestDividend != null
                ? `Last $${fmt(quote.LatestDividend)}${quote.LatestDividendDate ? ` · ${fmtTs(quote.LatestDividendDate)}` : ""}`
                : undefined
            }
          />
          <StatCard
            label="50-Day MA"
            value={money(quote.MovingAverage50)}
            accent={price && quote.MovingAverage50 ? (price >= quote.MovingAverage50 ? "up" : "down") : "neutral"}
          />
          <StatCard
            label="200-Day MA"
            value={money(quote.MovingAverage200)}
            accent={price && quote.MovingAverage200 ? (price >= quote.MovingAverage200 ? "up" : "down") : "neutral"}
          />
          <StatCard label="Bid" value={money(quote.Bid)} sub={quote.BidSize ? `× ${fmtVol(quote.BidSize)}` : undefined} />
          <StatCard label="Ask" value={money(quote.Ask)} sub={quote.AskSize ? `× ${fmtVol(quote.AskSize)}` : undefined} />
          <StatCard
            label="After Hours"
            value={money(quote.AfterHoursPrice)}
            sub={quote.AfterHoursTradeTime ? fmtTs(quote.AfterHoursTradeTime, "datetime") : undefined}
          />
          <StatCard label="Shares Out" value={quote.SharesOutstanding ? fmtVol(quote.SharesOutstanding) : "—"} />
          <StatCard
            label="3M Avg Volume"
            value={quote.AvgVolume3M ? fmtVol(quote.AvgVolume3M) : "—"}
            sub={quote.AvgVolume52 ? `52W ${fmtVol(quote.AvgVolume52)}` : undefined}
          />
        </div>
      </div>

      {(quote.StartingPrice1W ||
        quote.StartingPrice1M ||
        quote.StartingPrice3M ||
        quote.StartingPrice6M ||
        quote.StartingPrice52 ||
        quote.StartingPriceYTD) && (
        <div>
          <div className="text-xs uppercase tracking-wide text-muted font-bold mb-2 px-1">Performance</div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {(
              [
                ["1W", quote.StartingPrice1W],
                ["1M", quote.StartingPrice1M],
                ["3M", quote.StartingPrice3M],
                ["6M", quote.StartingPrice6M],
                ["YTD", quote.StartingPriceYTD],
                ["52W", quote.StartingPrice52],
              ] as const
            ).map(([label, start]) => {
              if (!start || !price) {
                return <StatCard key={label} label={label} value="—" />;
              }
              const pct = ((price - start) / start) * 100;
              return <StatCard key={label} label={label} value={`${changeSign(pct)}${fmt(pct)}%`} accent={pct >= 0 ? "up" : "down"} />;
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted px-1">
        {quote.ExchangeName && (
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3 h-3" /> {quote.ExchangeName}
            {quote.ExchangeShortName && <span className="text-muted/60">({quote.ExchangeShortName})</span>}
          </div>
        )}
        {quote.SecurityTypeName && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="w-3 h-3" /> {quote.SecurityTypeName}
            {quote.NominalCurrencyCode && <span className="text-muted/60">· {quote.NominalCurrencyCode}</span>}
          </div>
        )}
        {(quote as { CLWebsite?: string }).CLWebsite && (
          <a
            href={
              (quote as { CLWebsite?: string }).CLWebsite!.startsWith("http")
                ? (quote as { CLWebsite?: string }).CLWebsite
                : `https://${(quote as { CLWebsite?: string }).CLWebsite}`
            }
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-accent-soft transition-colors"
          >
            <Globe className="w-3 h-3" /> {(quote as { CLWebsite?: string }).CLWebsite}
          </a>
        )}
        {quote.LastTradeTime && (
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Last trade <LastTradeTime ts={quote.LastTradeTime} delay={quote.Delay} exchangeDelay={quote.ExchangeDelay} />
          </div>
        )}
      </div>
    </div>
  );
}
