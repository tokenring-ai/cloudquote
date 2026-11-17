import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import type TokenRingApp from "@tokenring-ai/app";
import type { TokenRingService } from "@tokenring-ai/app/types";
import { z } from "zod";

/** Watchlists of callers without an authenticated name share this scope. */
export const DEFAULT_WATCHLIST_SCOPE = "default";
export const MAX_WATCHLIST_SYMBOLS = 200;
export const MAX_WATCHLIST_SYMBOL_LENGTH = 24;

const SYMBOL_PATTERN = /^[A-Z0-9][A-Z0-9.^=/_:-]*$/;

/**
 * Filesystem-safe scope for a username: the same readable slug + hash scheme
 * the dashboard plugin uses, so one user maps to one directory name everywhere.
 */
export function watchlistScopeForUsername(username: string | null | undefined): string {
  if (!username || username.trim().length === 0) return DEFAULT_WATCHLIST_SCOPE;
  const hash = createHash("sha256").update(username, "utf8").digest("hex").slice(0, 12);
  const slug = username
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[^a-z0-9]+/, "")
    .replace(/[-.]+$/, "")
    .slice(0, 48);
  return slug.length > 0 ? `${slug}-${hash}` : `u-${hash}`;
}

/** Trim, uppercase and dedupe (first occurrence wins); blanks are dropped, malformed or excess symbols throw. */
export function normalizeWatchlistSymbols(input: readonly string[]): string[] {
  const seen = new Set<string>();
  for (const raw of input) {
    const symbol = raw.trim().toUpperCase();
    if (symbol.length === 0) continue;
    if (symbol.length > MAX_WATCHLIST_SYMBOL_LENGTH || !SYMBOL_PATTERN.test(symbol)) {
      throw new Error(`Invalid symbol: ${raw.slice(0, MAX_WATCHLIST_SYMBOL_LENGTH + 1)}`);
    }
    seen.add(symbol);
  }
  if (seen.size > MAX_WATCHLIST_SYMBOLS) {
    throw new Error(`A watchlist holds at most ${MAX_WATCHLIST_SYMBOLS} symbols`);
  }
  return [...seen];
}

const StoredWatchlistSchema = z.object({
  symbols: z.array(z.string()),
  updatedAt: z.number(),
});

export type WatchlistRecord = z.output<typeof StoredWatchlistSchema>;
export type SaveWatchlistResult = ({ status: "success" } & WatchlistRecord) | ({ status: "conflict" } & WatchlistRecord);

/**
 * One JSON file per user at `<workspace>/stocks/<scope>/watchlist.json`.
 * `updatedAt === 0` means the user never saved a list. Saves for one scope run
 * under a lock so the optimistic-concurrency check and the write are one step.
 */
export default class WatchlistService implements TokenRingService {
  readonly name = "WatchlistService";
  readonly description = "Persists per-user stock watchlists";

  private locks = new Map<string, Promise<unknown>>();

  constructor(private readonly app: TokenRingApp) {}

  scopeFor(username: string | null | undefined): string {
    return watchlistScopeForUsername(username);
  }

  private filePath(scope: string): string {
    return path.join(this.app.getWorkspaceResolvedPath("stocks"), scope, "watchlist.json");
  }

  private withLock<T>(scope: string, task: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(scope) ?? Promise.resolve();
    const run = previous.catch(() => {}).then(task);
    this.locks.set(scope, run);
    const release = () => {
      if (this.locks.get(scope) === run) this.locks.delete(scope);
    };
    run.then(release, release);
    return run;
  }

  async get(scope: string): Promise<WatchlistRecord> {
    try {
      const parsed = StoredWatchlistSchema.safeParse(JSON.parse(await fs.readFile(this.filePath(scope), "utf8")));
      if (parsed.success) return parsed.data;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        this.app.serviceError(this, `Failed to read watchlist ${scope}`, error);
      }
    }
    return { symbols: [], updatedAt: 0 };
  }

  async save(scope: string, symbols: readonly string[], expectedUpdatedAt?: number): Promise<SaveWatchlistResult> {
    const normalized = normalizeWatchlistSymbols(symbols);
    return this.withLock(scope, async () => {
      const existing = await this.get(scope);
      if (expectedUpdatedAt !== undefined && existing.updatedAt > expectedUpdatedAt) {
        return { status: "conflict", ...existing };
      }
      const record: WatchlistRecord = { symbols: normalized, updatedAt: Math.max(Date.now(), existing.updatedAt + 1) };
      const file = this.filePath(scope);
      await fs.mkdir(path.dirname(file), { recursive: true });
      const temp = `${file}.${process.pid}.${Date.now()}.${Math.random().toString(36).slice(2)}.tmp`;
      await fs.writeFile(temp, JSON.stringify(record), "utf8");
      await fs.rename(temp, file);
      return { status: "success", ...record };
    });
  }
}
