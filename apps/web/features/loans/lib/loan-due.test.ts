import { describe, expect, it } from "vitest";
import { dueSoonLabel, getLoanDue } from "@/features/loans/lib/loan-due";

const today = new Date(2026, 4, 25);

describe("getLoanDue", () => {
  it("flags a date before today as overdue", () => {
    expect(getLoanDue("2026-05-24", today)).toEqual({
      status: "overdue",
      days: -1,
    });
  });

  it("flags today as soon", () => {
    expect(getLoanDue("2026-05-25", today)).toEqual({
      status: "soon",
      days: 0,
    });
  });

  it("flags up to 7 days ahead as soon", () => {
    expect(getLoanDue("2026-06-01", today)).toEqual({
      status: "soon",
      days: 7,
    });
  });

  it("keeps dates more than 7 days ahead as ok", () => {
    expect(getLoanDue("2026-06-02", today)).toEqual({
      status: "ok",
      days: 8,
    });
  });
});

describe("dueSoonLabel", () => {
  it("labels today, tomorrow and the remaining days", () => {
    expect(dueSoonLabel(0)).toBe("Vence hoy");
    expect(dueSoonLabel(1)).toBe("Vence mañana");
    expect(dueSoonLabel(5)).toBe("Vence en 5 días");
  });
});
