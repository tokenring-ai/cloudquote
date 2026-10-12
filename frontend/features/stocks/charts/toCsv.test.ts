import { describe, expect, it } from "bun:test";
import type { StockHistoricalRow } from "../types.ts";
import { downloadCsv, historyToCsv } from "./toCsv.ts";

function historyRows(rows: (number | string | undefined)[][]): StockHistoricalRow[] {
  return rows as unknown as StockHistoricalRow[];
}

describe("historyToCsv", () => {
  it("emits a header plus one row per session including the adjusted close", () => {
    const csv = historyToCsv(historyRows([["2024-01-02", 10, 12, 9, 11, 1000, 10.9]]));
    expect(csv).toBe("Date,Open,High,Low,Close,AdjClose,Volume\n2024-01-02,10,12,9,11,10.9,1000\n");
  });

  it("emits an empty adjusted-close column when the feed omits it", () => {
    const csv = historyToCsv(historyRows([["2024-01-02", 10, 12, 9, 11, 1000, undefined as unknown as number]]));
    expect(csv).toContain("2024-01-02,10,12,9,11,,1000");
  });

  it("escapes cells that contain commas or quotes", () => {
    const csv = historyToCsv(historyRows([["2024-01-02", 'a,"b', 1, 1, 1, 1, 1]]));
    expect(csv).toContain('"a,""b"');
  });
});

describe("downloadCsv", () => {
  it("creates a blob URL, clicks an anchor and cleans up", () => {
    const urls: string[] = [];
    const revoked: string[] = [];
    const anchor = { href: "", download: "", click: () => {}, remove: () => {} };
    const appended: unknown[] = [];
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = (blob: Blob) => {
      expect(blob.size).toBeGreaterThan(0);
      const url = "blob:mock";
      urls.push(url);
      return url;
    };
    URL.revokeObjectURL = (url: string) => revoked.push(url);
    // oxlint-disable-next-line typescript/no-deprecated -- the test deliberately stubs createElement
    const originalCreateElement = document.createElement.bind(document);
    // oxlint-disable-next-line typescript/no-deprecated -- the test deliberately stubs createElement
    document.createElement = (tag: string) => {
      if (tag === "a") {
        anchor.click = () => appended.push(anchor.download);
        return anchor as unknown as HTMLAnchorElement;
      }
      return originalCreateElement(tag as keyof HTMLElementTagNameMap);
    };
    const originalAppend = document.body.appendChild.bind(document.body);
    document.body.appendChild = (<T extends Node>(node: T) => node) as typeof document.body.appendChild;

    try {
      downloadCsv("aapl.csv", "Date,Close\n2024-01-02,11\n");
      expect(urls).toEqual(["blob:mock"]);
      expect(anchor.download).toBe("aapl.csv");
      expect(appended).toEqual(["aapl.csv"]);
      expect(revoked).toEqual(["blob:mock"]);
    } finally {
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
      // oxlint-disable-next-line typescript/no-deprecated -- restoring the stubbed API
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppend;
    }
  });
});
