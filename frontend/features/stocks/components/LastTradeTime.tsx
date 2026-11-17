import { Badge } from "@tokenring-ai/one-frontend/ui";
import { useEffect, useState } from "react";
import { describeDelay, fmtAge, fmtTs } from "../formatters.ts";

/**
 * When the quote last traded and how stale that is ("5/1/2026, 2:32 PM · 3 min ago"), plus whether the
 * data is delayed. `Delay` is the minutes the quote is behind the exchange and `ExchangeDelay` the minutes
 * the exchange is supposed to be delayed; with no `Delay` nothing is claimed beyond the age.
 */
export default function LastTradeTime({
  ts,
  now,
  delay,
  exchangeDelay,
}: {
  ts: number;
  now?: number;
  delay?: number | string | null | undefined;
  exchangeDelay?: number | string | null | undefined;
}) {
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (now !== undefined) return;
    const timer = setInterval(() => setTick(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, [now]);
  const age = fmtAge(ts, now ?? tick);
  const delayInfo = describeDelay(delay, exchangeDelay);
  return (
    <span data-testid="last-trade-time">
      {fmtTs(ts, "datetime")}
      {age && <span className="text-muted/70"> · {age}</span>}
      {delayInfo && (
        <span title={delayInfo.detail} data-testid="quote-delay" className="ml-1.5 align-middle">
          <Badge tone={delayInfo.kind === "delayed" ? "warning" : "success"}>{delayInfo.label}</Badge>
        </span>
      )}
    </span>
  );
}
