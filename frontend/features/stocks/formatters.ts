export function pricePrecision(n: number | null | undefined): number {
  const abs = Math.abs(Number(n) || 0);
  if (abs >= 10) return 2;
  if (abs >= 1) return 3;
  return 4;
}

export function fmt(n: number | string | null | undefined, digits = 2) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return Number(n).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function fmtPrice(n: number | string | null | undefined) {
  if (n == null || n === "" || Number.isNaN(Number(n))) return "—";
  return fmt(n, pricePrecision(Number(n)));
}

export { formatCompact as fmtVol } from "@tokenring-ai/utility/number/formatCompact";

export function fmtMarketCap(price?: number, shares?: number): string {
  if (!price || !shares) return "—";
  const cap = price * shares;
  if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
  if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
  if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
  return `$${fmt(cap)}`;
}

/** "+" only for strictly positive values; flat/missing/negative get no prefix. */
export function changeSign(v: number | string | null | undefined): string {
  if (v == null || v === "") return "";
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? "+" : "";
}

export function fmtTs(ts: number | null | undefined, kind: "date" | "datetime" = "date"): string {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return kind === "datetime" ? d.toLocaleString() : d.toLocaleDateString();
}

/**
 * How long ago `ts` (epoch ms) was, relative to `now`: "just now", "3 min ago",
 * "2 h ago", "4 d ago". A timestamp slightly in the future (clock skew) reads as "just now".
 */
export function fmtAge(ts: number | null | undefined, now: number = Date.now()): string {
  if (!ts || Number.isNaN(new Date(ts).getTime())) return "";
  const seconds = Math.max(0, Math.round((now - ts) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} h ago`;
  return `${Math.floor(hours / 24)} d ago`;
}

/**
 * Normalize a history/tick timestamp to epoch milliseconds.
 * CloudQuote typically returns ms; some feeds use µs/ns or seconds.
 */
export function parseHistoryDate(v: number | string): number {
  if (typeof v === "string") {
    const t = Date.parse(v);
    return Number.isNaN(t) ? 0 : t;
  }
  // nanoseconds (~1e18) → ms
  if (v > 1e16) return v / 1e6;
  // microseconds (~1e15) → ms
  if (v > 1e14) return v / 1e3;
  // seconds (~1e9) → ms
  if (v > 0 && v < 1e11) return v * 1000;
  // already milliseconds (~1e12)
  return v;
}

/** Format a history row date (epoch ms or YYYY-MM-DD) for display. */
export function fmtHistoryDate(v: number | string | null | undefined): string {
  if (v == null || v === "") return "—";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const ts = parseHistoryDate(v as number | string);
  if (!ts) return String(v);
  return new Date(ts).toLocaleDateString("en-CA"); // YYYY-MM-DD
}

/** Format a Date as local calendar YYYY-MM-DD (avoids UTC skew from toISOString). */
export function toLocalIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** ISO date (YYYY-MM-DD) offset by `days` from today (local calendar). */
export function isoDateOffset(days: number, from = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return toLocalIsoDate(d);
}

/**
 * Shift a YYYY-MM-DD calendar date by `days` without timezone skew.
 * Returns null if `iso` is not a plain date string.
 */
export function shiftIsoDate(iso: string, days: number): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days);
  return toLocalIsoDate(d);
}

/**
 * CloudQuote getPriceHistory works best with a 1-day buffer on each side.
 * Returns { from, to } suitable for the RPC.
 */
export function historyRange(monthsBack: number): { from: string; to: string } {
  const end = new Date();
  end.setDate(end.getDate() + 1);
  const start = new Date();
  start.setMonth(start.getMonth() - monthsBack);
  start.setDate(start.getDate() - 1);
  return {
    from: toLocalIsoDate(start),
    to: toLocalIsoDate(end),
  };
}

/** ±1 day buffer around a user-selected history range for the CloudQuote RPC. */
export function bufferedHistoryRange(from: string, to: string): { from: string; to: string } | null {
  const bufferedFrom = shiftIsoDate(from, -1);
  const bufferedTo = shiftIsoDate(to, 1);
  if (!bufferedFrom || !bufferedTo) return null;
  return { from: bufferedFrom, to: bufferedTo };
}

export interface DelayInfo {
  label: string;
  /** `delayed` when the data is behind the exchange; `realtime` when it is not. */
  kind: "delayed" | "realtime";
  /** Plain-language explanation for a tooltip. */
  detail: string;
}

/** "15 min", "1 h", "1 h 30 min". */
export function fmtMinutes(minutes: number): string {
  const whole = Math.round(minutes);
  if (whole < 60) return `${whole} min`;
  const hours = Math.floor(whole / 60);
  const rest = whole % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

function parseMinutes(value: number | string | null | undefined): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const minutes = typeof value === "number" ? value : Number.parseFloat(value);
  return Number.isFinite(minutes) && minutes >= 0 ? minutes : undefined;
}

/**
 * What a quote's delay fields say. `Delay` is how many minutes behind the exchange this quote is;
 * `ExchangeDelay` is how many minutes the exchange itself is supposed to be delayed (for example a
 * delayed public feed). Returns null when `Delay` is absent or unreadable: nothing is claimed then.
 */
export function describeDelay(delay: number | string | null | undefined, exchangeDelay?: number | string | null): DelayInfo | null {
  const behind = parseMinutes(delay);
  if (behind === undefined) return null;
  const expected = parseMinutes(exchangeDelay);
  const expectedNote = expected !== undefined && expected > 0 ? ` This exchange's data is supposed to be delayed ${fmtMinutes(expected)}.` : "";

  if (behind === 0) {
    return { kind: "realtime", label: "Real-time", detail: `This quote is not delayed.${expectedNote}` };
  }
  const extra =
    expected !== undefined && expected > 0 && behind > expected ? ` That is more than the ${fmtMinutes(expected)} the exchange is supposed to be delayed.` : "";
  return {
    kind: "delayed",
    label: `Delayed ${fmtMinutes(behind)}`,
    detail: `This quote is ${fmtMinutes(behind)} behind the exchange.${expectedNote ? expectedNote : ""}${extra}`,
  };
}
