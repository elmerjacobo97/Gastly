import { describe, expect, it } from "vitest";
import { computeLoanInterest } from "@/features/loans/lib/loan-interest";

function disbursement(
  id: string,
  amount: number,
  occurredOn: string,
  interestRate = 0,
) {
  return { id, amount, occurredOn, interestRate };
}

function payment(
  id: string,
  disbursementId: string,
  amount: number,
  occurredOn: string,
) {
  return { id, disbursementId, amount, occurredOn };
}

describe("computeLoanInterest", () => {
  it("returns zeros when there are no movements", () => {
    expect(computeLoanInterest([], [], "2026-01-15")).toEqual({
      accruedInterest: 0,
      outstandingPrincipal: 0,
      totalDue: 0,
      unappliedAmount: 0,
      disbursements: [],
    });
  });

  it("accrues a monthly rate over a 30 day period", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-01-01", 10)],
      [],
      "2026-01-31",
    );

    expect(result).toEqual({
      accruedInterest: 100,
      outstandingPrincipal: 1000,
      totalDue: 1100,
      unappliedAmount: 0,
      disbursements: [{ id: "d1", outstanding: 1100 }],
    });
  });

  it("uses a 30 day month regardless of calendar length", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-02-01", 10)],
      [],
      "2026-03-03",
    );

    expect(result.accruedInterest).toBe(100);
    expect(result.totalDue).toBe(1100);
  });

  it("accrues nothing when the rate is zero", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 500, "2026-01-01", 0)],
      [],
      "2026-06-30",
    );

    expect(result).toEqual({
      accruedInterest: 0,
      outstandingPrincipal: 500,
      totalDue: 500,
      unappliedAmount: 0,
      disbursements: [{ id: "d1", outstanding: 500 }],
    });
  });

  it("accrues nothing on a zero amount disbursement", () => {
    const result = computeLoanInterest(
      [disbursement("d0", 0, "2026-01-01", 10)],
      [],
      "2026-01-31",
    );

    expect(result).toEqual({
      accruedInterest: 0,
      outstandingPrincipal: 0,
      totalDue: 0,
      unappliedAmount: 0,
      disbursements: [{ id: "d0", outstanding: 0 }],
    });
  });

  it("accrues nothing when asOf equals the disbursement date", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-01-15", 10)],
      [],
      "2026-01-15",
    );

    expect(result.accruedInterest).toBe(0);
    expect(result.totalDue).toBe(1000);
  });

  it("rounds accrued interest to two decimals", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 100, "2026-01-01", 5)],
      [],
      "2026-01-02",
    );

    expect(result.accruedInterest).toBe(0.17);
    expect(result.totalDue).toBe(100.17);
  });

  it("accrues per bucket and accumulates rounded amounts", () => {
    const result = computeLoanInterest(
      [
        disbursement("a", 100, "2026-01-01", 5),
        disbursement("b", 100, "2026-01-02", 5),
      ],
      [],
      "2026-01-03",
    );

    expect(result.accruedInterest).toBe(0.51);
    expect(result.outstandingPrincipal).toBe(200);
  });

  it("applies a payment to interest first", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-01-01", 10)],
      [payment("p1", "d1", 50, "2026-01-31")],
      "2026-01-31",
    );

    expect(result).toEqual({
      accruedInterest: 50,
      outstandingPrincipal: 1000,
      totalDue: 1050,
      unappliedAmount: 0,
      disbursements: [{ id: "d1", outstanding: 1050 }],
    });
  });

  it("applies the remainder of a payment to principal", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-01-01", 10)],
      [payment("p1", "d1", 150, "2026-01-31")],
      "2026-01-31",
    );

    expect(result).toEqual({
      accruedInterest: 0,
      outstandingPrincipal: 950,
      totalDue: 950,
      unappliedAmount: 0,
      disbursements: [{ id: "d1", outstanding: 950 }],
    });
  });

  it("tracks payments beyond the debt as unapplied", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-01-01", 0)],
      [payment("p1", "d1", 1200, "2026-01-31")],
      "2026-01-31",
    );

    expect(result).toEqual({
      accruedInterest: 0,
      outstandingPrincipal: 0,
      totalDue: 0,
      unappliedAmount: 200,
      disbursements: [{ id: "d1", outstanding: 0 }],
    });
  });

  it("tracks payments to unknown disbursements as unapplied", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-01-01", 0)],
      [payment("p1", "ghost", 300, "2026-01-10")],
      "2026-01-31",
    );

    expect(result.outstandingPrincipal).toBe(1000);
    expect(result.unappliedAmount).toBe(300);
    expect(result.totalDue).toBe(1000);
  });

  it("processes same day disbursement before payment", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-01-01", 10)],
      [payment("p1", "d1", 100, "2026-01-01")],
      "2026-01-31",
    );

    expect(result).toEqual({
      accruedInterest: 90,
      outstandingPrincipal: 900,
      totalDue: 990,
      unappliedAmount: 0,
      disbursements: [{ id: "d1", outstanding: 990 }],
    });
  });

  it("tracks a payment dated before its disbursement as unapplied", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-01-10", 10)],
      [payment("p1", "d1", 100, "2026-01-05")],
      "2026-01-31",
    );

    expect(result.accruedInterest).toBe(70);
    expect(result.outstandingPrincipal).toBe(1000);
    expect(result.unappliedAmount).toBe(100);
    expect(result.totalDue).toBe(1070);
  });

  it("ignores movements after asOf", () => {
    const result = computeLoanInterest(
      [disbursement("d1", 1000, "2026-02-01", 10)],
      [payment("p1", "d1", 100, "2026-02-05")],
      "2026-01-15",
    );

    expect(result).toEqual({
      accruedInterest: 0,
      outstandingPrincipal: 0,
      totalDue: 0,
      unappliedAmount: 0,
      disbursements: [],
    });
  });

  it("accrues each bucket independently when paying only one", () => {
    const result = computeLoanInterest(
      [
        disbursement("a", 1000, "2026-01-01", 10),
        disbursement("b", 1000, "2026-01-01", 10),
      ],
      [payment("p1", "b", 50, "2026-01-31")],
      "2026-01-31",
    );

    expect(result).toEqual({
      accruedInterest: 150,
      outstandingPrincipal: 2000,
      totalDue: 2150,
      unappliedAmount: 0,
      disbursements: [
        { id: "a", outstanding: 1100 },
        { id: "b", outstanding: 1050 },
      ],
    });
  });
});
