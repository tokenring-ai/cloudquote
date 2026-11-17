import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type TokenRingApp from "@tokenring-ai/app";
import cloudquoteRPC from "../rpc/cloudquote.ts";
import WatchlistService, { MAX_WATCHLIST_SYMBOLS, normalizeWatchlistSymbols, watchlistScopeForUsername } from "../WatchlistService.ts";

type Method = { execute: (args: unknown, app: TokenRingApp, context?: { username: string | null }) => Promise<any> };
const methods = (cloudquoteRPC as unknown as { methods: Record<string, Method> }).methods;

describe("watchlist", () => {
  let workspace: string;
  let app: TokenRingApp;

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "tokenring-watchlist-"));
    const fake = { getWorkspaceResolvedPath: (p: string) => path.join(workspace, p), serviceError: () => {} } as unknown as TokenRingApp;
    const service = new WatchlistService(fake);
    app = { getWorkspaceResolvedPath: fake.getWorkspaceResolvedPath, requireService: () => service } as unknown as TokenRingApp;
  });

  afterEach(async () => {
    await fs.rm(workspace, { recursive: true, force: true });
  });

  it("normalizes: trims, uppercases, dedupes, drops blanks", () => {
    expect(normalizeWatchlistSymbols([" aapl ", "AAPL", "", "brk.b", "msft"])).toEqual(["AAPL", "BRK.B", "MSFT"]);
  });

  it("rejects malformed symbols and oversized lists", () => {
    expect(() => normalizeWatchlistSymbols(["A B"])).toThrow();
    expect(() => normalizeWatchlistSymbols(["../etc"])).toThrow();
    expect(() => normalizeWatchlistSymbols(["X".repeat(25)])).toThrow();
    expect(() => normalizeWatchlistSymbols(Array.from({ length: MAX_WATCHLIST_SYMBOLS + 1 }, (_, i) => `S${i}`))).toThrow();
  });

  it("returns an empty never-saved list, then round-trips a save", async () => {
    expect(await methods.getWatchlist!.execute({}, app, { username: "alice" })).toEqual({ symbols: [], updatedAt: 0 });
    const saved = await methods.saveWatchlist!.execute({ symbols: ["aapl", "msft", "aapl"] }, app, { username: "alice" });
    expect(saved.status).toBe("success");
    expect(saved.symbols).toEqual(["AAPL", "MSFT"]);
    expect(await methods.getWatchlist!.execute({}, app, { username: "alice" })).toEqual({ symbols: ["AAPL", "MSFT"], updatedAt: saved.updatedAt });
  });

  it("isolates users and uses the default scope for anonymous callers", async () => {
    await methods.saveWatchlist!.execute({ symbols: ["AAPL"] }, app, { username: "alice" });
    await methods.saveWatchlist!.execute({ symbols: ["TSLA"] }, app, { username: "bob" });
    await methods.saveWatchlist!.execute({ symbols: ["SPY"] }, app);
    expect((await methods.getWatchlist!.execute({}, app, { username: "alice" })).symbols).toEqual(["AAPL"]);
    expect((await methods.getWatchlist!.execute({}, app, { username: "bob" })).symbols).toEqual(["TSLA"]);
    expect((await methods.getWatchlist!.execute({}, app, { username: null })).symbols).toEqual(["SPY"]);
    expect(await fs.readdir(path.join(workspace, "stocks"))).toContain("default");
    expect(watchlistScopeForUsername("Bob")).not.toBe(watchlistScopeForUsername("bob"));
  });

  it("reports a conflict when the stored list is newer than expected", async () => {
    const first = await methods.saveWatchlist!.execute({ symbols: ["AAPL"] }, app);
    const second = await methods.saveWatchlist!.execute({ symbols: ["MSFT"], expectedUpdatedAt: first.updatedAt }, app);
    expect(second.status).toBe("success");
    const stale = await methods.saveWatchlist!.execute({ symbols: ["NVDA"], expectedUpdatedAt: first.updatedAt }, app);
    expect(stale.status).toBe("conflict");
    expect(stale.symbols).toEqual(["MSFT"]);
    expect((await methods.getWatchlist!.execute({}, app)).symbols).toEqual(["MSFT"]);
  });

  it("surfaces validation errors from the RPC", async () => {
    await expect(methods.saveWatchlist!.execute({ symbols: ["bad symbol"] }, app)).rejects.toThrow();
  });
});
