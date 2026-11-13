import DataGrid from "@tokenring-ai/one-frontend/components/ui/DataGrid.tsx";
import ViewHeader from "@tokenring-ai/one-frontend/components/ui/ViewHeader.tsx";
import ViewShell from "@tokenring-ai/one-frontend/components/ui/ViewShell.tsx";
import { useStockLeaders } from "@tokenring-ai/one-frontend/rpc.ts";
import { Button, TextField } from "@tokenring-ai/one-frontend/ui";
import { TrendingDown, TrendingUp, Zap } from "lucide-react";
import { useMemo, useState } from "react";
import { useClientSort } from "../features/stocks/clientSort.ts";
import { fmt, fmtPrice, fmtVol } from "../features/stocks/formatters.ts";
import { STOCKS_GRADIENT } from "../ids.ts";
import { useStocksLayoutNavigation } from "../lib/useStocksLayoutNavigation.ts";

const LIST_TABS = [
  { key: "PERCENTGAINERS", label: "Gainers", icon: <TrendingUp className="w-3 h-3" /> },
  { key: "PERCENTLOSERS", label: "Losers", icon: <TrendingDown className="w-3 h-3" /> },
  { key: "MOSTACTIVE", label: "Most Active", icon: <Zap className="w-3 h-3" /> },
] as const;

type ListKey = (typeof LIST_TABS)[number]["key"];
type SecurityType = "STOCK" | "ETF";

const COLUMNS = [
  { name: "symbol", label: "Symbol", renderCell: renderSymbolCell },
  { name: "name", label: "Company", renderCell: renderNameCell },
  { name: "price", label: "Price", isNumeric: true, renderCell: renderPriceCell },
  { name: "change", label: "Change", isNumeric: true, renderCell: renderChangeCell },
  { name: "changePct", label: "Change %", isNumeric: true, renderCell: renderChangePctCell },
  { name: "volume", label: "Volume", isNumeric: true, renderCell: renderVolumeCell },
];

const MAX_COMPARE = 4;

/**
 * Movers boards with the screener filters the RPC has always supported
 * (security type, price range) — rows open the symbol, a selection of up to
 * four seeds the Compare view.
 */
export default function StocksScreenerPane() {
  const { openSymbol, openCompare } = useStocksLayoutNavigation();
  const [list, setList] = useState<ListKey>("PERCENTGAINERS");
  const [securityType, setSecurityType] = useState<SecurityType | null>(null);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filters = useMemo(() => {
    const parsed = {
      ...(securityType ? { type: securityType } : {}),
      ...(minPrice !== "" && Number(minPrice) > 0 ? { minPrice: Number(minPrice) } : {}),
      ...(maxPrice !== "" && Number(maxPrice) > 0 ? { maxPrice: Number(maxPrice) } : {}),
    };
    return Object.keys(parsed).length ? parsed : undefined;
  }, [securityType, minPrice, maxPrice]);

  const board = useStockLeaders(list, 50, filters);

  const rows = useMemo(
    () =>
      (board.data?.rows ?? [])
        .filter(Boolean)
        .map((row, i) => ({
          symbol: String(row.Symbol ?? "").toUpperCase(),
          name: String(row.Name ?? ""),
          // Missing figures stay null and render "—" (not a misleading $0 / 0%).
          price: numberOrNull(row.Price),
          change: numberOrNull(row.Change),
          changePct: numberOrNull(row.ChangePercent),
          volume: numberOrNull(row.Volume),
          _index: i,
        }))
        .filter(row => row.symbol),
    [board.data],
  );

  const { sorted, orderBy, onSort } = useClientSort(rows);

  const toggleRow = (row: Record<string, unknown>) => {
    const symbol = String(row.symbol);
    setSelected(current => {
      const next = new Set(current);
      if (next.has(symbol)) next.delete(symbol);
      else if (next.size < MAX_COMPARE) next.add(symbol);
      return next;
    });
  };

  const openComparison = () => {
    if (selected.size >= 2) openCompare([...selected]);
  };

  return (
    <ViewShell
      scroll={false}
      header={
        <ViewHeader
          variant="panel"
          icon={TrendingUp}
          iconGradient={STOCKS_GRADIENT}
          title="Screener"
          subtitle="Market movers by board, security type and price range"
        />
      }
    >
      <div className="h-full min-h-0 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex gap-1">
            {LIST_TABS.map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setList(tab.key)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors cursor-pointer focus-ring border ${
                  list === tab.key ? "bg-accent text-white border-accent" : "bg-secondary text-muted hover:text-primary border-primary"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1">
            {(["STOCK", "ETF"] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSecurityType(current => (current === type ? null : type))}
                aria-pressed={securityType === type}
                className={`px-2 py-0.5 text-[11px] font-medium rounded-md border transition-colors cursor-pointer focus-ring ${
                  securityType === type ? "bg-accent text-white border-accent" : "bg-secondary text-muted hover:text-primary border-primary"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1 text-[11px] text-muted">
            Min $
            <TextField type="number" min={0} value={minPrice} onChange={setMinPrice} className="w-20" aria-label="Minimum price" />
          </label>
          <label className="flex items-center gap-1 text-[11px] text-muted">
            Max $
            <TextField type="number" min={0} value={maxPrice} onChange={setMaxPrice} className="w-20" aria-label="Maximum price" />
          </label>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[11px] text-muted">
              {selected.size}/{MAX_COMPARE} for compare
            </span>
            <Button disabled={selected.size < 2} onClick={openComparison} title="Compare the selected symbols">
              Compare selected
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto" data-testid="stocks-screener-table">
          <DataGrid
            rows={sorted}
            columns={COLUMNS}
            orderBy={orderBy}
            rowKeyOf={row => String(row.symbol)}
            loading={board.isLoading}
            error={board.error}
            onRetry={() => void board.mutate()}
            onSort={onSort}
            onToggleRow={toggleRow}
            selectedKeys={selected}
            onOpenRow={row => openSymbol(String(row.symbol))}
            showDataTypeLabels={false}
            showPrimaryKeyIndicators={false}
            size="xs"
            loadingMessage="Loading movers…"
            emptyMessage="No symbols match the current filters"
          />
        </div>
      </div>
    </ViewShell>
  );
}

function numberOrNull(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const DASH = <span className="text-muted">—</span>;

function renderSymbolCell(value: unknown) {
  return <span className="font-bold text-accent-soft">{String(value)}</span>;
}

function renderNameCell(value: unknown) {
  return <span className="truncate max-w-48 inline-block">{String(value)}</span>;
}

function renderPriceCell(value: unknown) {
  if (value == null) return DASH;
  return <span className="font-mono">${fmtPrice(value as number)}</span>;
}

function renderChangeCell(value: unknown) {
  if (value == null) return DASH;
  const n = value as number;
  return (
    <span className={`font-mono ${n >= 0 ? "text-emerald-500" : "text-red-500"}`}>
      {n >= 0 ? "+" : ""}
      {fmt(n)}
    </span>
  );
}

function renderChangePctCell(value: unknown) {
  if (value == null) return DASH;
  const n = value as number;
  return (
    <span className={`font-mono ${n >= 0 ? "text-emerald-500" : "text-red-500"}`}>
      {n >= 0 ? "+" : ""}
      {fmt(n)}%
    </span>
  );
}

function renderVolumeCell(value: unknown) {
  if (value == null) return DASH;
  return <span className="font-mono text-muted">{fmtVol(value as number)}</span>;
}
