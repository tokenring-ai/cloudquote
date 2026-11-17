import { beforeEach, describe, expect, it, mock } from "bun:test";
import { act, renderHook, waitFor } from "@testing-library/react";

type Remote = { symbols: string[]; updatedAt: number };
let remote: Remote = { symbols: [], updatedAt: 0 };
let offline = false;
const saves: Array<{ symbols: string[]; expectedUpdatedAt?: number }> = [];

void mock.module("@tokenring-ai/one-frontend/rpc.ts", () => ({
  cloudquoteRPCClient: {
    getWatchlist: async () => {
      if (offline) throw new Error("offline");
      return remote;
    },
    saveWatchlist: async (args: { symbols: string[]; expectedUpdatedAt?: number }) => {
      if (offline) throw new Error("offline");
      saves.push(args);
      if (args.expectedUpdatedAt !== undefined && remote.updatedAt > args.expectedUpdatedAt) return { status: "conflict", ...remote };
      remote = { symbols: [...new Set(args.symbols.map(s => s.toUpperCase()))], updatedAt: remote.updatedAt + 1 };
      return { status: "success", ...remote };
    },
  },
}));

const { resetWatchlistStoreForTests, useWatchlist } = await import("./watchlist.ts");

beforeEach(() => {
  localStorage.clear();
  remote = { symbols: [], updatedAt: 0 };
  offline = false;
  saves.length = 0;
  resetWatchlistStoreForTests();
});

describe("useWatchlist", () => {
  it("shows defaults first, then adopts the server list", async () => {
    remote = { symbols: ["TSLA"], updatedAt: 5 };
    const { result } = renderHook(() => useWatchlist());
    expect(result.current.symbols).toEqual(["AAPL", "MSFT", "NVDA", "SPY"]);
    await waitFor(() => expect(result.current.symbols).toEqual(["TSLA"]));
    expect(JSON.parse(localStorage.getItem("stocks:watchlist")!)).toEqual(["TSLA"]);
    expect(saves).toHaveLength(0);
  });

  it("uploads a legacy local list once when the server has none", async () => {
    localStorage.setItem("stocks:watchlist", JSON.stringify(["amd", "intc"]));
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => expect(remote.symbols).toEqual(["AMD", "INTC"]));
    expect(result.current.symbols).toEqual(["AMD", "INTC"]);
    expect(saves).toHaveLength(1);
  });

  it("does not upload the built-in defaults when nothing was stored", async () => {
    renderHook(() => useWatchlist());
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(saves).toHaveLength(0);
  });

  it("saves add/remove/toggle to the server", async () => {
    remote = { symbols: ["AAPL"], updatedAt: 1 };
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => expect(result.current.symbols).toEqual(["AAPL"]));
    act(() => result.current.add("nvda"));
    expect(result.current.isWatched("NVDA")).toBe(true);
    await waitFor(() => expect(remote.symbols).toEqual(["AAPL", "NVDA"]));
    act(() => result.current.toggle("AAPL"));
    await waitFor(() => expect(remote.symbols).toEqual(["NVDA"]));
    act(() => result.current.remove("NVDA"));
    await waitFor(() => expect(remote.symbols).toEqual([]));
  });

  it("re-applies an edit on top of a newer server list after a conflict", async () => {
    remote = { symbols: ["AAPL"], updatedAt: 1 };
    const { result } = renderHook(() => useWatchlist());
    await waitFor(() => expect(result.current.symbols).toEqual(["AAPL"]));
    remote = { symbols: ["AAPL", "TSLA"], updatedAt: 2 }; // another browser saved
    act(() => result.current.add("MSFT"));
    await waitFor(() => expect(remote.symbols).toEqual(["AAPL", "TSLA", "MSFT"]));
    expect(result.current.symbols).toEqual(["AAPL", "TSLA", "MSFT"]);
  });

  it("keeps working offline using the local copy", async () => {
    offline = true;
    const { result } = renderHook(() => useWatchlist());
    act(() => result.current.add("AMD"));
    expect(result.current.symbols).toContain("AMD");
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(JSON.parse(localStorage.getItem("stocks:watchlist")!)).toContain("AMD");
    expect(remote.updatedAt).toBe(0);
  });
});
