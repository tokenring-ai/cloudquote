import type { DataGridOrderBy } from "@tokenring-ai/one-frontend/components/ui/DataGrid.tsx";
import { useCallback, useMemo, useState } from "react";

function compareValues(a: unknown, b: unknown): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

/**
 * Sorts rows by one column. Missing values (null/undefined/NaN) always sort
 * last, whichever the direction. The sort is stable, so ties keep input order.
 */
export function sortRows<T extends Record<string, unknown>>(rows: readonly T[], order: DataGridOrderBy | null): T[] {
  if (!order) return [...rows];
  const sign = order.direction === "asc" ? 1 : -1;
  const missing = (value: unknown) => value == null || (typeof value === "number" && Number.isNaN(value));
  return [...rows].sort((left, right) => {
    const a = left[order.column];
    const b = right[order.column];
    if (missing(a) || missing(b)) return missing(a) === missing(b) ? 0 : missing(a) ? 1 : -1;
    return sign * compareValues(a, b);
  });
}

/**
 * Client-side single-column sorting for a DataGrid: clicking a new header
 * sorts it ascending, clicking the sorted header again flips the direction.
 */
export function useClientSort<T extends Record<string, unknown>>(rows: readonly T[], initial: DataGridOrderBy | null = null) {
  const [order, setOrder] = useState<DataGridOrderBy | null>(initial);
  const sorted = useMemo(() => sortRows(rows, order), [rows, order]);
  const onSort = useCallback((column: string) => {
    setOrder(current => (current?.column === column ? { column, direction: current.direction === "asc" ? "desc" : "asc" } : { column, direction: "asc" }));
  }, []);
  const orderBy = useMemo(() => (order ? [order] : []), [order]);
  return { sorted, orderBy, onSort };
}
