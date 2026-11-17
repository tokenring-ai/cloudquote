import { readLocalStorageState, writeLocalStorageState } from "@tokenring-ai/one-frontend/hooks/useLocalStorageState.ts";
import { cloudquoteRPCClient } from "@tokenring-ai/one-frontend/rpc.ts";
import { useEffect, useSyncExternalStore } from "react";

/** First-paint cache of the server list (and the pre-server legacy store, uploaded once). */
const WATCHLIST_KEY = "stocks:watchlist";
const DEFAULT_WATCHLIST = ["AAPL", "MSFT", "NVDA", "SPY"];
const MAX_SAVE_ATTEMPTS = 3;

type Op = { kind: "add" | "remove"; symbol: string };

interface Store {
  symbols: string[];
  /** `updatedAt` of the last server copy seen; null until the server has answered. */
  serverUpdatedAt: number | null;
  /** True when local edits have not reached the server (offline or failed save). */
  dirty: boolean;
}

const normalize = (list: readonly string[]) => [...new Set(list.map(s => s.trim().toUpperCase()).filter(Boolean))];

function readCache(): { symbols: string[]; stored: boolean } {
  const raw = readLocalStorageState<unknown>(WATCHLIST_KEY, null);
  if (!Array.isArray(raw)) return { symbols: DEFAULT_WATCHLIST, stored: false };
  return { symbols: normalize(raw.filter((s): s is string => typeof s === "string")), stored: true };
}

let store: Store | null = null;
let loading: Promise<void> | null = null;
/** Saves run one at a time so each carries the previous save's `updatedAt`. */
let queue: Promise<void> = Promise.resolve();
const listeners = new Set<() => void>();

function current(): Store {
  store ??= { symbols: readCache().symbols, serverUpdatedAt: null, dirty: false };
  return store;
}

function update(patch: Partial<Store>): void {
  const next = { ...current(), ...patch };
  const symbolsChanged = patch.symbols !== undefined && patch.symbols.join() !== current().symbols.join();
  store = symbolsChanged ? next : { ...next, symbols: current().symbols };
  if (symbolsChanged) writeLocalStorageState(WATCHLIST_KEY, store.symbols);
  for (const listener of listeners) listener();
}

function applyOp(list: string[], op: Op): string[] {
  return op.kind === "add" ? normalize([...list, op.symbol]) : list.filter(s => s !== op.symbol);
}

/** Fetch the server list once per page; an empty never-saved server list adopts the legacy local list. */
function load(): Promise<void> {
  loading ??= fetchRemote().then(ok => {
    if (!ok) loading = null; // offline: keep the local copy and try again on the next mount or edit
  });
  return loading;
}

async function fetchRemote(): Promise<boolean> {
  try {
    const remote = await cloudquoteRPCClient.getWatchlist({});
    if (remote.updatedAt > 0) {
      const dirty = current().dirty;
      // Offline edits stay on top and are pushed below; otherwise adopt the server copy.
      update(dirty ? { serverUpdatedAt: remote.updatedAt } : { symbols: remote.symbols, serverUpdatedAt: remote.updatedAt });
      if (dirty) void enqueueSave(null);
      return true;
    }
    update({ serverUpdatedAt: 0 });
    const cached = readCache();
    // Legacy localStorage list, uploaded once; not awaited (the save queue may be waiting on this load).
    if (cached.stored && cached.symbols.length > 0) void enqueueSave(null);
    return true;
  } catch {
    return false;
  }
}

/** Push the local list to the server; `op` is re-applied on top of the server list after a conflict. */
function enqueueSave(op: Op | null): Promise<void> {
  queue = queue.then(async () => {
    try {
      if (current().serverUpdatedAt === null) await load();
      if (current().serverUpdatedAt === null) {
        update({ dirty: true });
        return;
      }
      for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt++) {
        const expected = current().serverUpdatedAt ?? 0;
        const result = await cloudquoteRPCClient.saveWatchlist({ symbols: current().symbols, expectedUpdatedAt: expected });
        if (result.status === "success") {
          update({ symbols: result.symbols, serverUpdatedAt: result.updatedAt, dirty: false });
          return;
        }
        update({ symbols: op ? applyOp(result.symbols, op) : current().symbols, serverUpdatedAt: result.updatedAt });
      }
      update({ dirty: true });
    } catch {
      update({ dirty: true });
    }
  });
  return queue;
}

function mutate(op: Op): void {
  const next = applyOp(current().symbols, op);
  if (next.join() === current().symbols.join()) return;
  update({ symbols: next, dirty: true });
  void enqueueSave(op);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => current().symbols;

/** Test hook: forget all module state (and cached server data). */
export function resetWatchlistStoreForTests(): void {
  store = null;
  loading = null;
  queue = Promise.resolve();
  for (const listener of listeners) listener();
}

/**
 * The user's starred symbols, shared by every stocks panel and stored on the
 * server per signed-in user. localStorage only seeds the first paint and keeps
 * the list usable while the server is unreachable.
 */
export function useWatchlist(): {
  symbols: string[];
  isWatched: (symbol: string) => boolean;
  toggle: (symbol: string) => void;
  remove: (symbol: string) => void;
  add: (symbol: string) => void;
} {
  const symbols = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  useEffect(() => {
    void load();
  }, []);

  return {
    symbols,
    isWatched: (symbol: string) => symbols.includes(symbol.trim().toUpperCase()),
    toggle: (symbol: string) => {
      const upper = symbol.trim().toUpperCase();
      mutate({ kind: current().symbols.includes(upper) ? "remove" : "add", symbol: upper });
    },
    remove: (symbol: string) => mutate({ kind: "remove", symbol: symbol.trim().toUpperCase() }),
    add: (symbol: string) => mutate({ kind: "add", symbol: symbol.trim().toUpperCase() }),
  };
}
