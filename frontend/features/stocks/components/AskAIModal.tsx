import LaunchAgentModal from "@tokenring-ai/one-frontend/components/ui/LaunchAgentModal.tsx";
import { useStockPriceHistory, useStockPriceTicks } from "@tokenring-ai/one-frontend/rpc.ts";
import { useMemo } from "react";
import { historyRange } from "../formatters.ts";
import type { StockQuote } from "../types.ts";

interface AskAIModalProps {
  symbol: string;
  quoteData: StockQuote | undefined;
  onClose: () => void;
}

/**
 * Ask-AI launch dialog. Fetches the last sessions of daily and intraday data
 * itself (it is only mounted while open) so the quote workspace stays light.
 */
export default function AskAIModal({ symbol, quoteData, onClose }: AskAIModalProps) {
  const range = useMemo(() => historyRange(3), []);
  const history = useStockPriceHistory(symbol, range.from, range.to);
  const ticks = useStockPriceTicks(symbol);

  const contextData = useMemo(
    () => ({
      symbol,
      quote: quoteData,
      recentHistory: history.data?.rows.slice(-20),
      recentTicks: ticks.data?.rows.slice(-20),
    }),
    [symbol, quoteData, history.data, ticks.data],
  );

  return (
    <LaunchAgentModal
      title={`Ask AI about ${symbol}`}
      description="Launches a new agent with current quote + history as context"
      defaultQuestion={`Analyze the stock ${symbol}. What do you think about the current price action and near-term outlook?`}
      contextData={contextData}
      contextFileName={`tokenring-stock-${symbol}-\${timestamp}.json`}
      messagePrefix={[`You are analyzing stock ${symbol}.`, `Use the attached market data and available financial tools (cloudquote, newsrpm) as needed.`].join(
        "\n",
      )}
      messageSource="Stocks app"
      onClose={onClose}
    />
  );
}
