import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate } from "@/lib/format";

const clean = (value: string) => value.replace(/\u00a0/g, " ");

describe("formatCurrency", () => {
  it("formats soles with es-PE grouping by default", () => {
    expect(clean(formatCurrency(1234.56))).toBe("S/ 1,234.56");
  });

  it("formats large amounts with thousands separators", () => {
    expect(clean(formatCurrency(1234567.891))).toBe("S/ 1,234,567.89");
  });

  it("formats USD and MXN currencies", () => {
    expect(clean(formatCurrency(1000, "USD"))).toBe("USD 1,000.00");
    expect(clean(formatCurrency(1000, "MXN"))).toBe("MXN 1,000.00");
  });

  it("formats zero with two decimals", () => {
    expect(clean(formatCurrency(0))).toBe("S/ 0.00");
  });

  it("keeps the negative sign", () => {
    expect(clean(formatCurrency(-50.5))).toBe("-S/ 50.50");
  });

  it("rounds to two decimals", () => {
    expect(clean(formatCurrency(0.005))).toBe("S/ 0.01");
    expect(clean(formatCurrency(2.344))).toBe("S/ 2.34");
  });
});

describe("formatDate", () => {
  it("formats an ISO date with day, short month and year", () => {
    const formatted = formatDate("2026-07-15");
    expect(formatted).toContain("15");
    expect(formatted).toContain("jul");
    expect(formatted).toContain("2026");
  });

  it("does not shift the date across a year boundary", () => {
    const formatted = formatDate("2026-01-01");
    expect(formatted).toContain("01");
    expect(formatted).toContain("2026");
  });

  it("handles leap day", () => {
    const formatted = formatDate("2024-02-29");
    expect(formatted).toContain("29");
    expect(formatted).toContain("2024");
  });

  it("throws on invalid date strings", () => {
    expect(() => formatDate("not-a-date")).toThrow(RangeError);
  });
});
