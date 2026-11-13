import DataGrid from "@tokenring-ai/one-frontend/components/ui/DataGrid.tsx";
import DateRangePicker, { type DateRange } from "@tokenring-ai/one-frontend/components/ui/DateRangePicker.tsx";
import EmptyState from "@tokenring-ai/one-frontend/components/ui/EmptyState.tsx";
import ViewHeader from "@tokenring-ai/one-frontend/components/ui/ViewHeader.tsx";
import ViewShell from "@tokenring-ai/one-frontend/components/ui/ViewShell.tsx";
import type { ViewProps } from "@tokenring-ai/one-frontend/layout/define.ts";
import { useStockPriceHistory } from "@tokenring-ai/one-frontend/rpc.ts";
import { Download, History, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { downloadCsv, historyToCsv } from "../features/stocks/charts/toCsv.ts";
import { useClientSort } from "../features/stocks/clientSort.ts";
import { bufferedHistoryRange, changeSign, fmt, fmtHistoryDate, fmtVol, isoDateOffset } from "../features/stocks/formatters.ts";
import { STOCKS_GRADIENT } from "../ids.ts";

interface HistoryRow extends Record<string, unknown> {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number | null;
  volume: number;
  changePct: number | null;
}

const COLUMNS = [
  { name: "date", label: "Date", dataType: "date", renderCell: renderDateCell },
  { name: "open", label: "Open", isNumeric: true, renderCell: renderMoneyCell },
  { name: "high", label: "High", isNumeric: true, renderCell: renderMoneyCell },
  { name: "low", label: "Low", isNumeric: true, renderCell: renderMoneyCell },
  { name: "close", label: "Close", isNumeric: true, renderCell: renderMoneyCell },
  { name: "adjClose", label: "Adj Close", isNumeric: true, renderCell: renderMoneyCell },
  { name: "changePct", label: "Change %", isNumeric: true, renderCell: renderChangeCell },
  { name: "volume", label: "Volume", isNumeric: true, renderCell: renderVolumeCell },
];

/**
 * Historical OHLCV table for one symbol, including the adjusted close the API
 * has always returned but no view showed, with sorting, date-range presets and
 * CSV export.
 */
export default function StocksHistoryPane({ params }: ViewProps) {
  const symbol = params.symbol ?? "";
  const [range, setRange] = useState<DateRange>(() => ({
    from: isoDateOffset(-90),
    to: isoDateOffset(0),
  }));
  // API gets a ±1-day buffer around the user's selection.
  const [fetchParams, setFetchParams] = useState(
    () => bufferedHistoryRange(isoDateOffset(-90), isoDateOffset(0)) ?? { from: isoDateOffset(-91), to: isoDateOffset(1) },
  );
  const history = useStockPriceHistory(symbol || undefined, fetchParams.from, fetchParams.to);

  const applyRange = (next: DateRange) => {
    setRange(next);
    const buffered = bufferedHistoryRange(next.from, next.to);
    if (buffered) setFetchParams(buffered);
  };

  const rows = useMemo<HistoryRow[]>(() => {
    const raw = [...(history.data?.rows ?? [])].sort((a, b) => Number(a[0]) - Number(b[0]));
    return raw.map((row, i) => {
      const prevClose = i > 0 ? raw[i - 1]![4] : null;
      const close = row[4];
      return {
        date: fmtHistoryDate(row[0]),
        open: row[1],
        high: row[2],
        low: row[3],
        close,
        adjClose: row[6],
        volume: row[5],
        changePct: prevClose ? ((close - prevClose) / prevClose) * 100 : null,
      };
    });
  }, [history.data]);

  const { sorted, orderBy, onSort } = useClientSort(rows, { column: "date", direction: "desc" });

  const exportCsv = () => downloadCsv(`${symbol.toLowerCase()}-history.csv`, historyToCsv(history.data?.rows ?? []));

  return (
    <ViewShell
      scroll={false}
      header={
        <ViewHeader
          variant="panel"
          icon={TrendingUp}
          iconGradient={STOCKS_GRADIENT}
          title={`History · ${symbol}`}
          actions={[
            {
              key: "csv",
              icon: <Download className="w-3.5 h-3.5" />,
              label: "CSV",
              title: "Download as CSV",
              onClick: exportCsv,
              disabled: !rows.length,
            },
          ]}
        />
      }
    >
      <div className="h-full min-h-0 flex flex-col gap-3">
        <DateRangePicker
          value={range}
          onChange={applyRange}
          fromAriaLabel="History start date"
          toAriaLabel="History end date"
          presets={[
            { label: "7D", days: 7 },
            { label: "30D", days: 30 },
            { label: "90D", days: 90 },
            { label: "1Y", days: 365 },
          ]}
        />

        <div className="flex-1 min-h-0 overflow-auto" data-testid="stocks-history-table">
          <DataGrid
            rows={sorted}
            columns={COLUMNS}
            orderBy={orderBy}
            rowKeyOf={row => String(row.date)}
            loading={history.isLoading}
            error={history.error}
            onRetry={() => void history.mutate()}
            onSort={onSort}
            showSelection={false}
            showDataTypeLabels={false}
            showPrimaryKeyIndicators={false}
            enableRowDetail={false}
            size="xs"
            loadingMessage="Loading price history…"
            emptyMessage="No history data for this range"
          />
        </div>
        {!history.isLoading && !history.error && rows.length === 0 && (
          <EmptyState icon={History} title="No history data" hint="Try a wider date range." variant="page" className="py-4" />
        )}
      </div>
    </ViewShell>
  );
}

function renderDateCell(value: unknown) {
  // The date column only ever renders the `fmtHistoryDate` string.
  return <span className="font-mono">{typeof value === "string" ? value : ""}</span>;
}

function renderMoneyCell(value: unknown) {
  return <span className="font-mono">{value == null ? "—" : fmt(value as number)}</span>;
}

function renderChangeCell(value: unknown) {
  if (value == null) return <span className="text-muted">—</span>;
  const pct = value as number;
  return (
    <span className={pct >= 0 ? "text-emerald-500" : "text-red-500"}>
      {changeSign(pct)}
      {fmt(pct)}%
    </span>
  );
}

function renderVolumeCell(value: unknown) {
  return <span className="font-mono text-muted">{fmtVol(value as number)}</span>;
}
