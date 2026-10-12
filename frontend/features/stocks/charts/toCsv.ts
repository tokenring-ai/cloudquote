import { fmtHistoryDate } from "../formatters.ts";
import type { StockHistoricalRow } from "../types.ts";

const HEADER = ["Date", "Open", "High", "Low", "Close", "AdjClose", "Volume"] as const;

function csvCell(value: string | number | null | undefined): string {
  // The feed can omit the adjusted close despite the schema typing it.
  const s = value == null ? "" : String(value);
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
}

/** History rows → RFC-4180 CSV including the adjusted close the API returns but the UI never showed. */
export function historyToCsv(rows: StockHistoricalRow[]): string {
  const lines = [HEADER.join(",")];
  for (const row of rows) {
    lines.push([fmtHistoryDate(row[0]), row[1], row[2], row[3], row[4], row[6], row[5]].map(csvCell).join(","));
  }
  return `${lines.join("\n")}\n`;
}

/** Triggers a client-side download of `csv` as `filename`. */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
