import EmptyState from "@tokenring-ai/one-frontend/components/ui/EmptyState.tsx";
import ViewHeader from "@tokenring-ai/one-frontend/components/ui/ViewHeader.tsx";
import ViewShell from "@tokenring-ai/one-frontend/components/ui/ViewShell.tsx";
import type { ViewProps } from "@tokenring-ai/one-frontend/layout/define.ts";
import { CandlestickChart, TrendingUp } from "lucide-react";
import LayoutPriceChartCard from "../features/stocks/components/LayoutPriceChartCard.tsx";
import { STOCKS_GRADIENT } from "../ids.ts";

/**
 * Full-height advanced charting for one symbol: candles/line/area, volume,
 * SMA overlays and log scale. Tiles beside the Market panel; the symbol comes
 * from the panel params, and the switcher opens the typed symbol's market view.
 */
export default function StocksChartPane({ params }: ViewProps) {
  if (!params.symbol) {
    return (
      <ViewShell header={<ViewHeader variant="panel" icon={TrendingUp} iconGradient={STOCKS_GRADIENT} title="Chart" />}>
        <EmptyState
          icon={CandlestickChart}
          title="No symbol selected"
          hint="Open a chart from a symbol's market panel, or pick a ticker in the navigator."
          variant="page"
        />
      </ViewShell>
    );
  }

  return (
    <ViewShell scroll={false} header={<ViewHeader variant="panel" icon={TrendingUp} iconGradient={STOCKS_GRADIENT} title={`Chart · ${params.symbol}`} />}>
      <div className="h-full min-h-0 flex flex-col">
        <LayoutPriceChartCard symbol={params.symbol} height={460} defaultType="candles" defaultInterval="6M" />
        <p className="text-[11px] text-muted px-1 pt-1">Drag to pan, scroll to zoom. Overlays: SMA 50 (indigo) and SMA 200 (amber) over daily closes.</p>
      </div>
    </ViewShell>
  );
}
