import { useLocalStorageState } from "@tokenring-ai/one-frontend/hooks/useLocalStorageState.ts";
import { useCallback, useMemo } from "react";

const WATCHLIST_KEY = "stocks:watchlist";
const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA", "SPY"];

/**
 * The user's starred symbols, shared by every stocks panel (the store syncs
 * across panels) and persisted locally.
 */
export function useWatchlist(): {
  symbols: string[];
  isWatched: (symbol: string) => boolean;
  toggle: (symbol: string) => void;
  remove: (symbol: string) => void;
  add: (symbol: string) => void;
} {
  const [stored, setStored] = useLocalStorageState<string[]>(WATCHLIST_KEY, DEFAULT_WATCHLIST);

  const symbols = useMemo(() => [...new Set(stored.map(symbol => symbol.toUpperCase()))], [stored]);
  const set = useMemo(() => new Set(symbols), [symbols]);

  const toggle = useCallback(
    (symbol: string) => {
      const upper = symbol.toUpperCase();
      setStored(current => {
        const list = [...new Set(current.map(s => s.toUpperCase()))];
        return list.includes(upper) ? list.filter(s => s !== upper) : [...list, upper];
      });
    },
    [setStored],
  );

  const remove = useCallback(
    (symbol: string) => {
      const upper = symbol.toUpperCase();
      setStored(current => current.filter(s => s.toUpperCase() !== upper));
    },
    [setStored],
  );

  const add = useCallback(
    (symbol: string) => {
      const upper = symbol.toUpperCase();
      setStored(current => [...new Set([...current.map(s => s.toUpperCase()), upper])]);
    },
    [setStored],
  );

  return { symbols, isWatched: (symbol: string) => set.has(symbol.toUpperCase()), toggle, remove, add };
}
