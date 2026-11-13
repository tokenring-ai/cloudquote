export const MAX_COMPARE_SYMBOLS = 4;

/** Tickers are case-insensitive; every panel, route and instance key uses the upper-case form. */
export function normalizeSymbol(symbol: string): string {
  return symbol.trim().toUpperCase();
}

/** Upper-cased, de-duplicated, empties dropped, order kept. */
export function normalizeSymbols(symbols: readonly string[]): string[] {
  return [...new Set(symbols.map(normalizeSymbol).filter(Boolean))];
}
