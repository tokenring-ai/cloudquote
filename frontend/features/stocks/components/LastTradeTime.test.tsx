import { describe, expect, it } from "bun:test";
import { render, screen } from "@testing-library/react";
import { describeDelay, fmtMinutes, fmtTs } from "../formatters.ts";
import LastTradeTime from "./LastTradeTime.tsx";

const now = 1_700_000_000_000;

describe("LastTradeTime", () => {
  it("shows the trade time with its age, and claims nothing about delay when the quote has no Delay", () => {
    render(<LastTradeTime ts={now - 3 * 60_000} now={now} exchangeDelay="15" />);
    const text = screen.getByTestId("last-trade-time").textContent ?? "";
    expect(text).toContain(fmtTs(now - 3 * 60_000, "datetime"));
    expect(text).toContain("3 min ago");
    expect(screen.queryByTestId("quote-delay")).toBeNull();
  });

  it("labels a delayed quote with the minutes it is behind", () => {
    render(<LastTradeTime ts={now - 3 * 60_000} now={now} delay={15} exchangeDelay="15" />);
    expect(screen.getByTestId("quote-delay")).toHaveTextContent("Delayed 15 min");
    expect(screen.getByTestId("quote-delay").getAttribute("title")).toContain("15 min behind the exchange");
  });

  it("labels a quote with no delay as real-time and says when the exchange is normally delayed", () => {
    render(<LastTradeTime ts={now - 60_000} now={now} delay={0} exchangeDelay="20" />);
    expect(screen.getByTestId("quote-delay")).toHaveTextContent("Real-time");
    expect(screen.getByTestId("quote-delay").getAttribute("title")).toContain("supposed to be delayed 20 min");
  });
});

describe("describeDelay", () => {
  it("reads Delay as minutes behind and ExchangeDelay as the delay the exchange is supposed to have", () => {
    expect(describeDelay(15, "15")).toMatchObject({ kind: "delayed", label: "Delayed 15 min" });
    expect(describeDelay(0, "0")).toMatchObject({ kind: "realtime", label: "Real-time" });
    expect(describeDelay(0, "15")?.detail).toContain("not delayed");
    expect(describeDelay(0, "15")?.detail).toContain("supposed to be delayed 15 min");
  });

  it("notes a quote that is further behind than the exchange is supposed to be", () => {
    expect(describeDelay(45, "15")?.detail).toContain("more than the 15 min");
    expect(describeDelay(15, "15")?.detail).not.toContain("more than");
  });

  it("claims nothing when Delay is missing or unreadable, and tolerates an unreadable ExchangeDelay", () => {
    expect(describeDelay(undefined, "15")).toBeNull();
    expect(describeDelay(null)).toBeNull();
    expect(describeDelay("", "15")).toBeNull();
    expect(describeDelay(Number.NaN)).toBeNull();
    expect(describeDelay(-5)).toBeNull();
    expect(describeDelay(15, "n/a")).toMatchObject({ kind: "delayed", label: "Delayed 15 min" });
  });

  it("formats long delays in hours", () => {
    expect([fmtMinutes(5), fmtMinutes(60), fmtMinutes(90), fmtMinutes(125)]).toEqual(["5 min", "1 h", "1 h 30 min", "2 h 5 min"]);
  });
});
