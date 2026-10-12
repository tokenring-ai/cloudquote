import { beforeEach, describe, expect, it, mock } from "bun:test";
import { renderHook, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardApiProvider } from "@tokenring-ai/one-frontend/dock/DashboardApiContext.tsx";
import type { ViewDefinition, ViewParams } from "@tokenring-ai/one-frontend/dock/types.ts";
import { createFakeDashboardApi, createFakePanelHandle, type FakeDashboardApi, renderView } from "@tokenring-ai/one-frontend/test/dock.tsx";
import { type ReactNode, useEffect, useState } from "react";
import { MemoryRouter } from "react-router-dom";
import { mockLightweightCharts } from "../features/stocks/charts/testLightweightCharts.ts";

mockLightweightCharts();

let quoteRow: Record<string, unknown>;
let moversRows: Record<string, unknown>[];
let newsRows: Record<string, unknown>[];
let historyRowsBySymbol: Record<string, unknown[][]>;
let moversError: Error | undefined;
let cloudquoteConfigured: boolean;

function quoteFor(symbols: string[]): Record<string, unknown> {
  return { rows: symbols.map(symbol => ({ ...quoteRow, Symbol: symbol })) };
}

const mutateNoop = mock(async () => undefined);
const swrShape = (data: unknown) => ({ data, isLoading: false, error: undefined, mutate: mutateNoop });

/** A useTypedSWR that actually runs its fetcher, so reader-style queries resolve. */
function fakeUseTypedSWR(key: unknown, fetcher?: () => Promise<unknown>) {
  const [state, setState] = useState<{ data: unknown; isLoading: boolean; error?: unknown }>({
    data: undefined,
    isLoading: Boolean(key && fetcher),
    error: undefined,
  });
  useEffect(() => {
    if (!key || !fetcher) return;
    let alive = true;
    fetcher()
      .then(data => {
        if (alive) setState({ data, isLoading: false, error: undefined });
      })
      .catch(error => {
        if (alive) setState({ data: undefined, isLoading: false, error });
      });
    return () => {
      alive = false;
    };
  }, [key, fetcher]);
  return { ...state, mutate: mutateNoop, isValidating: false };
}

function defaultQuoteRow(): Record<string, unknown> {
  return {
    Symbol: "AAPL",
    Name: "Apple Inc.",
    SymbolID: "stocks-1234",
    Price: 150,
    Change: 1.5,
    ChangePercent: 1.01,
    ExchangeShortName: "NASDAQ",
    Volume: 51_234_567,
  };
}

/** 5.5 months of synthetic daily closes so compare/screener views have data. */
function syntheticHistory(symbol: string): unknown[][] {
  const rows = historyRowsBySymbol[symbol];
  if (rows) return rows;
  const base = symbol === "MSFT" ? 300 : 150;
  const step = symbol === "MSFT" ? 10 : 5;
  return Array.from({ length: 160 }, (_, i) => [1_700_000_000_000 + i * 86_400_000, base + i, base + i + 1, base + i - 1, base + i + step, 1000 + i, base + i]);
}

void mock.module("@tokenring-ai/one-frontend/rpc.ts", () => ({
  useStockQuotesStream: (symbols: string[]) => swrShape(symbols.length ? quoteFor(symbols) : undefined),
  useStockQuote: (symbols: string[]) => swrShape(symbols.length ? quoteFor(symbols) : undefined),
  useStockPriceHistory: (symbol: string | undefined) => swrShape(symbol ? { rows: syntheticHistory(symbol) } : undefined),
  useStockPriceTicks: (symbol: string | undefined) => swrShape(symbol ? { rows: [] } : undefined),
  useStockLeaders: (list: string) =>
    moversError
      ? { ...swrShape(undefined), error: moversError }
      : swrShape({
          rows: moversRows,
          list,
        }),
  useStockHeadlines: () => swrShape(undefined),
  useFindStock: (search: string | undefined) =>
    swrShape(search ? { rows: [{ ...quoteRow, Symbol: search.toUpperCase(), Name: `${search.toUpperCase()} result` }] } : undefined),
  useNewsRPMIndexedDataSearchResults: () => swrShape(newsRows.length ? { rows: newsRows } : undefined),
  useTypedSWR: fakeUseTypedSWR,
  newsrpmRPCClient: {
    renderBody: mock(async (args: { bodyId: string }) => {
      // "native" is what real feeds tag their HTML with (the reader bug this covers).
      if (args.bodyId === "body-2") {
        return { success: true, body: { v: 1, chunks: [{ format: "native", content: "<p>Native full text of body-2</p>" }] } };
      }
      if (args.bodyId === "body-empty") {
        return { success: true, body: { v: 1, chunks: [] } };
      }
      return { success: true, body: { v: 1, chunks: [{ format: "html", content: `<p>Full text of ${args.bodyId}</p>` }] } };
    }),
  },
  cloudquoteRPCClient: { getStatus: async () => ({ configured: cloudquoteConfigured }) },
  useAgentTypes: () => ({ data: [{ type: "code", displayName: "Coding Agent", description: "", enabledTools: [] }], isLoading: false }),
  agentRPCClient: {},
  filesystemRPCClient: {},
}));

void mock.module("@tokenring-ai/one-frontend/hooks/useLiveStreamStatus.ts", () => ({
  useLiveStreamStatusFromSWR: () => ({ status: "live", isStale: false, showSpinner: false, isValidating: false, error: undefined }),
}));

const { default: contribution } = await import("../app.tsx");
const { stocksPath, useStocksNavigation } = await import("../lib/stocksShared.ts");

const getView = (id: string) => contribution.views.find(view => view.id === id) as ViewDefinition<any>;

function renderViewById(id: string, params: ViewParams = {}, api = fakeApi()) {
  const view = getView(id);
  const panel = createFakePanelHandle({ viewId: id, dashboardId: "stocks", panelId: `${id}:test`, params });
  return renderView(view, params, { api, panel, path: stocksPath((params.symbol as string | null) ?? null), routes: ["/stocks/:symbol?"] });
}

function fakeApi(): FakeDashboardApi {
  return createFakeDashboardApi({ dashboardId: "stocks", getView: id => getView(id) });
}

beforeEach(() => {
  mutateNoop.mockClear();
  quoteRow = defaultQuoteRow();
  moversRows = [
    { ...quoteRow, Symbol: "AMD", Name: "Advanced Micro Devices", Price: 210, Change: 5, ChangePercent: 2.4, Volume: 8_000_000 },
    { ...quoteRow, Symbol: "NVDA", Name: "NVIDIA", Price: 900, Change: -12, ChangePercent: -1.3, Volume: 40_000_000 },
  ];
  newsRows = [
    { slug: "aapl-earnings-1", headline: "Apple beats earnings", date: "2024-01-02", provider: "TestNews", bodyId: "body-1" },
    { slug: "aapl-native-2", headline: "Apple native-format story", date: "2024-01-01", provider: "TestNews", bodyId: "body-2" },
    { slug: "aapl-empty-3", headline: "Apple summary only", date: "2024-01-01", provider: "TestNews", bodyId: "body-empty" },
    { slug: "aapl-rumor-4", headline: "Apple rumored headset", date: "2024-01-01", provider: "TestNews" },
  ];
  historyRowsBySymbol = {};
  moversError = undefined;
  cloudquoteConfigured = true;
});

describe("StocksNavigatorView", () => {
  it("renders watchlist rows from the live stream and movers boards", async () => {
    renderViewById("stocks-navigator");

    // Watchlist defaults render with streamed quotes.
    expect(await screen.findByText("Watchlist")).toBeInTheDocument();
    expect(screen.getByTestId("watchlist-live")).toBeInTheDocument();
    // Movers: the mocked board carries AMD and NVDA.
    expect(await screen.findByTestId("mover-row-AMD")).toBeInTheDocument();
    expect(screen.getByTestId("mover-row-NVDA")).toBeInTheDocument();
  });

  it("opens a mover's market panel and updates the URL", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    renderViewById("stocks-navigator", {}, api);

    // data-testid sits on the row wrapper; the primary button carries the label.
    await user.click(await screen.findByRole("button", { name: "Open AMD" }));

    expect(api.opened).toEqual([expect.objectContaining({ viewId: "stocks-market", params: { symbol: "AMD" } })]);
    await waitFor(() => expect(screen.getByTestId("pathname").textContent).toBe("/stocks/AMD"));
  });
});

describe("StocksNavigatorView load errors", () => {
  it("shows a setup card naming the API key when CloudQuote is not configured", async () => {
    moversError = new Error("HTTP 401: Unauthorized");
    cloudquoteConfigured = false;
    renderViewById("stocks-navigator");

    const card = await screen.findByTestId("cloudquote-setup");
    expect(card.textContent).toContain("CLOUDQUOTE_API_KEY");
    expect(screen.getByRole("link", { name: "Open Configuration" }).getAttribute("href")).toBe("/configuration");
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("offers Retry for a failed load when the key is set", async () => {
    const user = userEvent.setup();
    moversError = new Error("network down");
    renderViewById("stocks-navigator");

    expect(await screen.findByText("Failed to load movers")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retry" }));
    expect(mutateNoop).toHaveBeenCalled();
    expect(screen.queryByTestId("cloudquote-setup")).toBeNull();
  });
});

describe("StocksChartView", () => {
  it("switches symbol only when the typed ticker is submitted", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    renderViewById("stocks-chart", { symbol: "AAPL" }, api);

    const input = await screen.findByLabelText("Switch symbol");
    await user.type(input, "msft");
    expect(api.opened).toEqual([]);
    expect((input as HTMLInputElement).value).toBe("MSFT");

    await user.type(input, "{Enter}");
    expect(api.opened).toEqual([expect.objectContaining({ viewId: "stocks-market", params: { symbol: "MSFT" } })]);
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("renders the advanced chart for the panel's symbol", async () => {
    renderViewById("stocks-chart", { symbol: "AAPL" });

    expect(await screen.findByTestId("price-chart-card")).toBeInTheDocument();
    expect(screen.getByText("Chart · AAPL")).toBeInTheDocument();
  });

  it("shows an empty state without a symbol", async () => {
    renderViewById("stocks-chart", {});

    expect(await screen.findByText("No symbol selected")).toBeInTheDocument();
  });
});

describe("StocksHistoryView", () => {
  it("renders the OHLCV table with adjusted close and a CSV export", async () => {
    renderViewById("stocks-history", { symbol: "AAPL" });

    expect(await screen.findByText("History · AAPL")).toBeInTheDocument();
    expect(screen.getByTestId("stocks-history-table")).toBeInTheDocument();
    expect(screen.getAllByText("Adj Close").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "CSV" })).toBeInTheDocument();
  });

  it("sorts newest first and re-sorts when a header is clicked", async () => {
    const user = userEvent.setup();
    historyRowsBySymbol.AAPL = [
      [Date.UTC(2024, 0, 2, 12), 10, 11, 9, 10, 300, 10],
      [Date.UTC(2024, 0, 3, 12), 10, 11, 9, 30, 100, 30],
      [Date.UTC(2024, 0, 4, 12), 10, 11, 9, 20, 200, 20],
    ];
    renderViewById("stocks-history", { symbol: "AAPL" });

    const table = await screen.findByTestId("stocks-history-table");
    const firstCells = () => [...table.querySelectorAll("tbody tr")].map(row => row.querySelector("td")?.textContent);
    await waitFor(() => expect(firstCells()).toHaveLength(3));
    expect(firstCells()).toEqual(["2024-01-04", "2024-01-03", "2024-01-02"]);

    await user.click(screen.getByRole("button", { name: /^Volume/ }));
    expect(firstCells()).toEqual(["2024-01-03", "2024-01-04", "2024-01-02"]);
  });
});

describe("StocksNewsView", () => {
  it("lists headlines and opens the in-app reader for articles with a body", async () => {
    const user = userEvent.setup();
    renderViewById("stocks-news", { symbol: "AAPL" });

    expect(await screen.findByText("Apple beats earnings")).toBeInTheDocument();
    expect(screen.getByText("Apple rumored headset")).toBeInTheDocument();

    await user.click(screen.getByText("Apple beats earnings"));

    // The reader fetches renderBody and shows the rendered chunk in the frame.
    expect(await screen.findByTestId("stocks-news-reader")).toBeInTheDocument();
    const frame = screen.getByTitle(/Article: Apple beats earnings/);
    expect(frame.getAttribute("srcdoc")).toContain("Full text of body-1");
    expect(screen.getByRole("button", { name: "All headlines" })).toBeInTheDocument();
  });

  it("renders native-format article bodies in the frame instead of as text", async () => {
    const user = userEvent.setup();
    renderViewById("stocks-news", { symbol: "AAPL" });

    await user.click(await screen.findByText("Apple native-format story"));

    const frame = await screen.findByTitle(/Article: Apple native-format story/);
    expect(frame.getAttribute("srcdoc")).toContain("Native full text of body-2");
    // The raw markup never leaks into the page as text.
    expect(screen.queryByText(/<p>Native full text/)).toBeNull();
  });

  it("offers the source link when an article's body is empty", async () => {
    const user = userEvent.setup();
    renderViewById("stocks-news", { symbol: "AAPL" });

    await user.click(await screen.findByText("Apple summary only"));

    expect(await screen.findByText("No full text available")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open at source" })).toBeInTheDocument();
  });

  it("opens the source externally for articles without full text", async () => {
    const user = userEvent.setup();
    const originalOpen = window.open;
    const openSpy = mock((_url: string | URL, _target?: string, _features?: string): Window | null => null);
    window.open = openSpy as unknown as typeof window.open;
    try {
      renderViewById("stocks-news", { symbol: "AAPL" });

      await user.click(await screen.findByText("Apple rumored headset"));

      expect(openSpy).toHaveBeenCalledWith("https://www.financialcontent.com/article/aapl-rumor-4", "_blank", "noopener,noreferrer");
      expect(screen.queryByTestId("stocks-news-reader")).toBeNull();
    } finally {
      window.open = originalOpen;
    }
  });
});

describe("StocksScreenerView", () => {
  it("renders the movers table with filters and a disabled compare button", async () => {
    renderViewById("stocks-screener");

    expect(await screen.findByText("Screener")).toBeInTheDocument();
    expect(screen.getByTestId("stocks-screener-table")).toBeInTheDocument();
    const compare = screen.getByRole("button", { name: "Compare selected" });
    expect(compare).toBeDisabled();
  });

  it("renders missing prices as a dash and sorts by a clicked header", async () => {
    const user = userEvent.setup();
    moversRows = [
      { Symbol: "AMD", Name: "Advanced Micro Devices", Price: 210, Change: 5, ChangePercent: 2.4, Volume: 8_000_000 },
      { Symbol: "XYZ", Name: "No Price Corp" },
      { Symbol: "NVDA", Name: "NVIDIA", Price: 900, Change: -12, ChangePercent: -1.3, Volume: 40_000_000 },
    ];
    renderViewById("stocks-screener");

    const table = await screen.findByTestId("stocks-screener-table");
    expect(table.textContent).not.toContain("$0.0000");
    const symbols = () => [...table.querySelectorAll("tbody tr")].map(row => (row.textContent?.match(/AMD|XYZ|NVDA/) ?? [])[0]);
    expect(symbols()).toEqual(["AMD", "XYZ", "NVDA"]);

    await user.click(screen.getByRole("button", { name: /^Price/ }));
    // Ascending; the missing price sorts last.
    expect(symbols()).toEqual(["AMD", "NVDA", "XYZ"]);
    await user.click(screen.getByRole("button", { name: /^Price/ }));
    expect(symbols()).toEqual(["NVDA", "AMD", "XYZ"]);
  });
});

describe("StocksCompareView", () => {
  it("compares the seeded symbols with a returns table", async () => {
    renderViewById("stocks-compare", { symbols: ["AAPL", "MSFT"] });

    expect(await screen.findByTestId("stocks-compare-chart")).toBeInTheDocument();
    const table = screen.getByTestId("stocks-compare-returns");
    expect(table.textContent).toContain("AAPL");
    expect(table.textContent).toContain("MSFT");
    expect(table.textContent).toContain("%");
    // One "6M" column (the trailing period); the whole-range return is "Total".
    const headers = [...table.querySelectorAll("th")].map(th => th.textContent);
    expect(headers.filter(h => h === "6M")).toHaveLength(1);
    expect(headers).toContain("Total");
  });

  it("prompts for symbols when seeded empty", async () => {
    renderViewById("stocks-compare", {});

    expect(await screen.findByText("Pick symbols to compare")).toBeInTheDocument();
  });
});

describe("StocksCompareView editing", () => {
  it("adds symbols to a seeded comparison and writes the list back to the panel", async () => {
    const user = userEvent.setup();
    const { panel } = renderViewById("stocks-compare", { symbols: ["aapl", "MSFT"] });

    expect(await screen.findByRole("button", { name: "Remove AAPL" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("Add symbol to compare"), "nvda{Enter}");

    expect(await screen.findByRole("button", { name: "Remove NVDA" })).toBeInTheDocument();
    expect(panel.params.symbols).toEqual(["AAPL", "MSFT", "NVDA"]);

    // Seeded symbols are as removable as added ones.
    await user.click(screen.getByRole("button", { name: "Remove AAPL" }));
    expect(screen.queryByRole("button", { name: "Remove AAPL" })).toBeNull();
    expect(panel.params.symbols).toEqual(["MSFT", "NVDA"]);
  });

  it("adds symbols to an empty comparison", async () => {
    const user = userEvent.setup();
    const { panel } = renderViewById("stocks-compare", {});

    await user.type(await screen.findByLabelText("Add symbol to compare"), "AMD{Enter}");
    expect(await screen.findByRole("button", { name: "Remove AMD" })).toBeInTheDocument();
    expect(panel.params.symbols).toEqual(["AMD"]);
  });
});

describe("useStocksNavigation.openCompare", () => {
  function renderNavigation(api: FakeDashboardApi) {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <MemoryRouter>
        <DashboardApiProvider value={api}>{children}</DashboardApiProvider>
      </MemoryRouter>
    );
    return renderHook(() => useStocksNavigation(), { wrapper });
  }

  it("replaces the open compare panel's symbols instead of only focusing it", () => {
    const api = fakeApi();
    const { result } = renderNavigation(api);

    result.current.openCompare(["AMD", "NVDA"]);
    expect(api.panels.filter(panel => panel.viewId === "stocks-compare")).toHaveLength(1);

    result.current.openCompare(["aapl", "MSFT", "TSLA"]);
    const compare = api.panels.filter(panel => panel.viewId === "stocks-compare");
    expect(compare).toHaveLength(1);
    expect(compare[0]!.params).toEqual({ symbols: ["AAPL", "MSFT", "TSLA"] });
    expect(api.opened).toHaveLength(1);
  });
});
