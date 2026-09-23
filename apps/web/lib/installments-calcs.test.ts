import { describe, expect, it } from "vitest";

import {
  getDisplayInstallment,
  getMonthInstallments,
} from "@/lib/installments-calcs";

type TestPayment = {
  id: string;
  dueOn: string;
  amount: number;
  transactionId: string | null;
  paidExternally: boolean;
};

type TestPurchase = {
  id: string;
  payments: TestPayment[];
};

function payment(
  overrides: Partial<TestPayment> & Pick<TestPayment, "id" | "dueOn">,
): TestPayment {
  return {
    amount: 100,
    transactionId: null,
    paidExternally: false,
    ...overrides,
  };
}

function purchase(id: string, payments: TestPayment[]): TestPurchase {
  return { id, payments };
}

const january = new Date(2026, 0, 15);

describe("getMonthInstallments", () => {
  it("includes payments inside the month", () => {
    const p1 = payment({ id: "p1", dueOn: "2026-01-10" });
    const p2 = payment({ id: "p2", dueOn: "2026-01-25" });
    const item = purchase("a", [p1, p2]);

    expect(getMonthInstallments([item], january)).toEqual([
      { payment: p1, purchase: item },
      { payment: p2, purchase: item },
    ]);
  });

  it("excludes payments outside the month", () => {
    const item = purchase("a", [
      payment({ id: "p1", dueOn: "2025-12-31" }),
      payment({ id: "p2", dueOn: "2026-02-01" }),
    ]);

    expect(getMonthInstallments([item], january)).toEqual([]);
  });

  it("includes the first and last day of the month", () => {
    const first = payment({ id: "p1", dueOn: "2026-01-01" });
    const last = payment({ id: "p2", dueOn: "2026-01-31" });
    const item = purchase("a", [first, last]);

    expect(getMonthInstallments([item], january)).toEqual([
      { payment: first, purchase: item },
      { payment: last, purchase: item },
    ]);
  });

  it("keeps payments from every purchase", () => {
    const a = purchase("a", [payment({ id: "p1", dueOn: "2026-01-05" })]);
    const b = purchase("b", [payment({ id: "p2", dueOn: "2026-01-06" })]);

    expect(getMonthInstallments([a, b], january)).toHaveLength(2);
  });
});

describe("getDisplayInstallment", () => {
  it("returns the unpaid payment of the current month", () => {
    const current = payment({ id: "p1", dueOn: "2026-01-10" });
    const item = purchase("a", [
      current,
      payment({ id: "p2", dueOn: "2026-02-10" }),
    ]);

    expect(getDisplayInstallment(item, january)).toBe(current);
  });

  it("returns undefined when the current month payment is already paid", () => {
    const paid = payment({
      id: "p1",
      dueOn: "2026-01-10",
      transactionId: "t1",
    });
    const item = purchase("a", [paid]);

    expect(getDisplayInstallment(item, january)).toBeUndefined();
  });

  it("skips a paid current month payment and returns the next unpaid one", () => {
    const paid = payment({
      id: "p1",
      dueOn: "2026-01-10",
      transactionId: "t1",
    });
    const next = payment({ id: "p2", dueOn: "2026-02-10" });
    const item = purchase("a", [paid, next]);

    expect(getDisplayInstallment(item, january)).toBe(next);
  });

  it("skips externally paid current month payments", () => {
    const external = payment({
      id: "p1",
      dueOn: "2026-01-10",
      paidExternally: true,
    });
    const item = purchase("a", [external]);

    expect(getDisplayInstallment(item, january)).toBeUndefined();
  });

  it("returns undefined when no unpaid payment remains", () => {
    const item = purchase("a", [
      payment({ id: "p1", dueOn: "2026-01-10", transactionId: "t1" }),
      payment({ id: "p2", dueOn: "2026-02-10", paidExternally: true }),
    ]);

    expect(getDisplayInstallment(item, january)).toBeUndefined();
  });
});
