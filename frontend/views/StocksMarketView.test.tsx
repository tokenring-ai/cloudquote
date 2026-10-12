import { beforeEach, describe, expect, it, mock } from "bun:test";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ViewDefinition, ViewParams } from "@tokenring-ai/one-frontend/dock/types.ts";
import { createFakeDashboardApi, createFakePanelHandle, type FakeDashboardApi, renderView } from "@tokenring-ai/one-frontend/test/dock.tsx";

// The quote the mocked RPC hooks hand out; tests may replace it.
let quoteRow: Record<string, unknown>;

function quoteFor(symbols: string[]): Record<string, unknown> {
  return { rows: symbols.map(symbol => ({ ...quoteRow, Symbol: symbol })) };
}

const mutateNoop = mock(async () => undefined);

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

const swrShape = (data: unknown) => ({ data, isLoading: false, error: undefined, mutate: mutateNoop });

void mock.module("@tokenring-ai/one-frontend/rpc.ts", () => ({
  useStockQuotesStream: (symbols: string[]) => swrShape(symbols.length ? quoteFor(symbols) : undefined),
  useStockQuote: (symbols: string[]) => swrShape(symbols.length ? quoteFor(symbols) : undefined),
  useStockPriceHistory: (symbol: string | undefined) => swrShape(symbol ? { rows: [] } : undefined),
  useStockPriceTicks: (symbol: string | undefined) => swrShape(symbol ? { rows: [] } : undefined),
  useStockLeaders: (list: string) => swrShape({ rows: [{ ...quoteRow, Symbol: "AMD", Name: "Advanced Micro Devices", Price: 210 }], list }),
  useStockHeadlines: () => swrShape(undefined),
  useFindStock: (search: string | undefined) =>
    swrShape(search ? { rows: [{ ...quoteRow, Symbol: search.toUpperCase(), Name: `${search.toUpperCase()} result` }] } : undefined),
  useNewsRPMIndexedDataSearchResults: () => swrShape(undefined),
  // app.tsx imports every view eagerly, including StocksNewsView, whose
  // useTypedSWR import must resolve even though these tests never render it.
  useTypedSWR: () => swrShape(undefined),
  newsrpmRPCClient: { renderBody: mock(async () => ({ success: true, body: { v: 1, chunks: [] } })) },
  cloudquoteRPCClient: {},
  // Pulled in through AskAIModal → LaunchAgentModal.
  useAgentTypes: () => ({ data: [{ type: "code", displayName: "Coding Agent", description: "", enabledTools: [] }], isLoading: false }),
  agentRPCClient: {},
  filesystemRPCClient: {},
}));

void mock.module("@tokenring-ai/one-frontend/hooks/useLiveStreamStatus.ts", () => ({
  useLiveStreamStatusFromSWR: () => ({ status: "live", isStale: false, showSpinner: false, isValidating: false, error: undefined }),
}));

const { default: contribution } = await import("../app.tsx");
const { stocksPath } = await import("../lib/stocksShared.ts");

const marketView = contribution.views.find(view => view.id === "stocks-market") as ViewDefinition<any>;
const getView = (id: string) => contribution.views.find(view => view.id === id);
const dashboard = contribution.dashboards[0]!;

const pickerPanel = () => ({ panelId: "stocks-market:new", viewId: "stocks-market", params: {}, title: "Market" });

function fakeApi(): FakeDashboardApi {
  return createFakeDashboardApi({ dashboardId: "stocks", getView });
}

function renderMarketView(params: ViewParams = {}, api = fakeApi()) {
  const panel = createFakePanelHandle({ viewId: "stocks-market", dashboardId: "stocks", panelId: "stocks-market:new", params });
  return renderView(marketView, params, { api, panel, path: stocksPath(params.symbol as string | null), routes: ["/stocks/:symbol?"] });
}

const pathname = () => screen.getByTestId("pathname").textContent;

describe("StocksMarketView", () => {
  beforeEach(() => {
    mutateNoop.mockClear();
    quoteRow = defaultQuoteRow();
  });

  it("renders the picker when opened without a symbol", async () => {
    renderMarketView({});

    // The view is lazy-loaded; findBy* waits out the Suspense fallback.
    expect(await screen.findByPlaceholderText(/Search by symbol or company name/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AAPL" })).toBeInTheDocument();
    expect(screen.getByText("Search a symbol or pick a quick ticker above")).toBeInTheDocument();
    // No detail pane without a symbol.
    expect(screen.queryByRole("button", { name: "Ask AI" })).not.toBeInTheDocument();
  });

  it("shows the live quote for the symbol named by its params", async () => {
    renderMarketView({ symbol: "AAPL" }, fakeApi());

    // The view is lazy-loaded; findBy* waits out the Suspense fallback.
    expect(await screen.findByText("Apple Inc.")).toBeInTheDocument();
    expect(screen.getByText("$150.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ask AI" })).toBeInTheDocument();
    // The embedded chart card renders (with no history data yet: its placeholder).
    expect(screen.getByTestId("price-chart-card")).toBeInTheDocument();
    // The detail replaces the picker hint; quick tickers stay.
    expect(screen.queryByText("Search a symbol or pick a quick ticker above")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "AAPL" })).toBeInTheDocument();
  });

  it("opens the chart, news and history views through the header tool buttons", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    renderMarketView({ symbol: "AAPL" }, api);

    await screen.findByText("Apple Inc.");
    await user.click(screen.getByRole("button", { name: /Chart/ }));

    expect(api.opened).toEqual([expect.objectContaining({ viewId: "stocks-chart", params: { symbol: "AAPL" } })]);
  });

  it("fills the picker panel instead of opening a second one when a quick ticker is chosen", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    api.panels.push(pickerPanel());
    renderMarketView({}, api);

    await user.click(screen.getByRole("button", { name: "MSFT" }));

    expect(api.opened).toEqual([]);
    expect(api.panels[0]!.params).toEqual({ symbol: "MSFT" });
    await waitFor(() => expect(pathname()).toBe("/stocks/MSFT"));
  });

  it("opens a fresh market panel when the dashboard has no picker to fill", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    renderMarketView({}, api);

    await user.click(screen.getByRole("button", { name: "MSFT" }));

    expect(api.opened).toEqual([expect.objectContaining({ viewId: "stocks-market", params: { symbol: "MSFT" } })]);
    await waitFor(() => expect(pathname()).toBe("/stocks/MSFT"));
  });

  it("jumps straight to a typed ticker on Enter even without search results", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    renderMarketView({}, api);

    const input = screen.getByPlaceholderText(/Search by symbol or company name/);
    await user.type(input, "qqq{Enter}");

    expect(api.opened).toEqual([expect.objectContaining({ viewId: "stocks-market", params: { symbol: "QQQ" } })]);
    await waitFor(() => expect(pathname()).toBe("/stocks/QQQ"));
  });

  it("returns to the picker from the detail's close button", async () => {
    const user = userEvent.setup();
    const api = fakeApi();
    const { panel } = renderMarketView({ symbol: "AAPL" }, api);

    await user.click(await screen.findByRole("button", { name: "Close" }));

    await waitFor(() => expect(pathname()).toBe("/stocks"));
    expect(panel.params.symbol).toBeUndefined();
  });
});

describe("Stocks dashboard definition", () => {
  beforeEach(() => {
    quoteRow = defaultQuoteRow();
  });

  const match = (pathname: string, params: Record<string, string | undefined>) => ({ pathname, params, searchParams: new URLSearchParams() });

  it("registers a navigator rail, per-symbol views and a screener/compare pair", () => {
    const ids = contribution.views.map(view => view.id);
    for (const id of ["stocks-navigator", "stocks-market", "stocks-chart", "stocks-news", "stocks-history", "stocks-screener", "stocks-compare"]) {
      expect(ids).toContain(id);
    }
    // Per-symbol views carry a required symbol param; the compare view takes a symbol list.
    const chartParams = (contribution.views.find(view => view.id === "stocks-chart") as ViewDefinition<any>).params!;
    const compareParams = (contribution.views.find(view => view.id === "stocks-compare") as ViewDefinition<any>).params!;
    expect(chartParams.safeParse({}).success).toBe(false);
    expect(chartParams.safeParse({ symbol: "AAPL" }).success).toBe(true);
    expect(compareParams.safeParse({ symbols: ["AAPL", "MSFT"] }).success).toBe(true);
  });

  it("derives its instance key and tab title from the symbol", () => {
    expect(marketView.instanceKey?.({ symbol: "AAPL" })).toBe("AAPL");
    expect(marketView.instanceKey?.({})).toBe("new");
    expect(marketView.titleFor?.({ symbol: "AAPL" })).toBe("Market · AAPL");
    expect(marketView.titleFor?.({})).toBe("Market");
  });

  it("lays the dashboard out as a navigator rail beside the market workspace", () => {
    const layout = dashboard.defaultLayout as { kind: string; children: { kind: string; view: string }[] };
    expect(layout.kind).toBe("row");
    expect(layout.children.map(child => child.view)).toEqual(["stocks-navigator", "stocks-market"]);
  });

  it("opens the market panel named by the route, filling the picker first", () => {
    const api = fakeApi();
    api.panels.push(pickerPanel());

    dashboard.onNavigate?.(match("/stocks", {}), api);
    expect(api.opened).toEqual([]);
    expect(api.panels[0]!.params).toEqual({});

    dashboard.onNavigate?.(match("/stocks/aapl", { symbol: "aapl" }), api);
    expect(api.opened).toEqual([]);
    expect(api.panels[0]!.params).toEqual({ symbol: "AAPL" });

    const freshApi = fakeApi();
    dashboard.onNavigate?.(match("/stocks/msft", { symbol: "msft" }), freshApi);
    expect(freshApi.opened.map(open => [open.viewId, open.params])).toEqual([["stocks-market", { symbol: "MSFT" }]]);
  });

  it("upper-cases the routed symbol so /stocks/aapl focuses the AAPL panel instead of adding a second", () => {
    const api = fakeApi();
    api.panels.push({ panelId: "stocks-market:AAPL", viewId: "stocks-market", params: { symbol: "AAPL" }, title: "Market · AAPL" });

    dashboard.onNavigate?.(match("/stocks/aapl", { symbol: "aapl" }), api);

    expect(api.opened).toEqual([]);
    expect(api.panels.filter(panel => panel.viewId === "stocks-market")).toHaveLength(1);
  });

  it("maps the active panel back to a URL and titles the document", () => {
    const path = (viewId: string, params: ViewParams) => dashboard.pathForActivePanel?.({ panelId: viewId, viewId, params }, match("/stocks", {}));
    expect(path("stocks-market", { symbol: "AAPL" })).toBe("/stocks/AAPL");
    expect(path("stocks-market", {})).toBeNull();
    expect(path("some-other-view", { symbol: "AAPL" })).toBeNull();

    expect(dashboard.documentTitle?.(match("/stocks/AAPL", { symbol: "AAPL" }))).toBe("AAPL · Stocks");
    expect(dashboard.documentTitle?.(match("/stocks", {}))).toBe("Stocks");
  });

  it("builds symbol routes that encode unsafe characters", () => {
    expect(stocksPath(null)).toBe("/stocks");
    expect(stocksPath("AAPL")).toBe("/stocks/AAPL");
    expect(stocksPath("BRK/B")).toBe("/stocks/BRK%2FB");
  });
});
