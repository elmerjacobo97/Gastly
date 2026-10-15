import { describe, expect, it } from "vitest";
import {
  allocateOffset,
  flattenLoanMovements,
  groupLoansByPerson,
  normalizePersonName,
} from "@/features/loans/lib/group-loans";
import type { Loan } from "@/features/loans/types/loan-types";

function makeLoan(overrides: Partial<Loan> = {}): Loan {
  return {
    id: "loan-1",
    personName: "Ana",
    direction: "lent",
    currency: "PEN",
    expectedOn: null,
    notes: null,
    disbursements: [],
    payments: [],
    accruedInterest: 0,
    pendingAmount: 0,
    isSettled: false,
    ...overrides,
  };
}

describe("normalizePersonName", () => {
  it("trims and lowercases", () => {
    expect(normalizePersonName("  Ana Pérez ")).toBe("ana pérez");
  });
});

describe("groupLoansByPerson", () => {
  it("returns no groups for an empty list", () => {
    expect(groupLoansByPerson([])).toEqual([]);
  });

  it("groups a single loan", () => {
    const groups = groupLoansByPerson([makeLoan({ id: "l1" })]);

    expect(groups).toHaveLength(1);
    expect(groups[0]).toMatchObject({
      key: "ana",
      personName: "Ana",
      isSettled: false,
    });
    expect(groups[0].balances.map((loan) => loan.id)).toEqual(["l1"]);
  });

  it("groups loans of the same person ignoring case and spacing", () => {
    const groups = groupLoansByPerson([
      makeLoan({ id: "l1", personName: " Ana " }),
      makeLoan({ id: "l2", personName: "ana" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].key).toBe("ana");
    expect(groups[0].personName).toBe(" Ana ");
    expect(groups[0].balances.map((loan) => loan.id)).toEqual(["l1", "l2"]);
  });

  it("merges both directions into net totals per currency", () => {
    const groups = groupLoansByPerson([
      makeLoan({ id: "l1", direction: "lent", pendingAmount: 333.97 }),
      makeLoan({ id: "l2", direction: "borrowed", pendingAmount: 13 }),
      makeLoan({ id: "l3", currency: "USD", pendingAmount: 2200 }),
      makeLoan({ id: "l4", isSettled: true, pendingAmount: 0 }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].totals).toEqual([
      { currency: "PEN", lent: 333.97, borrowed: 13, net: 320.97 },
      { currency: "USD", lent: 2200, borrowed: 0, net: 2200 },
    ]);
  });

  it("keeps the insertion order of first appearance", () => {
    const groups = groupLoansByPerson([
      makeLoan({ id: "l1", personName: "Zoe" }),
      makeLoan({ id: "l2", personName: "Ana" }),
      makeLoan({ id: "l3", personName: "zoe" }),
    ]);

    expect(groups.map((group) => group.personName)).toEqual(["Zoe", "Ana"]);
    expect(groups[0].balances).toHaveLength(2);
  });

  it("marks a group settled only when every loan is settled", () => {
    const mixed = groupLoansByPerson([
      makeLoan({ id: "l1", isSettled: true }),
      makeLoan({ id: "l2", isSettled: false }),
    ]);
    const settled = groupLoansByPerson([
      makeLoan({ id: "l1", isSettled: true }),
      makeLoan({ id: "l2", isSettled: true }),
    ]);

    expect(mixed[0].isSettled).toBe(false);
    expect(settled[0].isSettled).toBe(true);
  });
});

describe("allocateOffset", () => {
  const disbursement = (
    id: string,
    occurredOn: string,
    outstandingAmount: number,
  ) => ({
    id,
    loanId: "loan-1",
    amount: outstandingAmount,
    occurredOn,
    description: null,
    notes: null,
    interestRate: 0,
    outstandingAmount,
  });

  it("applies the amount to the oldest open disbursements first", () => {
    expect(
      allocateOffset(
        [
          disbursement("new", "2026-03-01", 50),
          disbursement("paid", "2026-01-01", 0),
          disbursement("old", "2026-02-01", 30),
        ],
        40,
      ),
    ).toEqual([
      { disbursementId: "old", amount: 30 },
      { disbursementId: "new", amount: 10 },
    ]);
  });

  it("never allocates more than the outstanding balance", () => {
    expect(
      allocateOffset([disbursement("only", "2026-01-01", 13)], 100),
    ).toEqual([{ disbursementId: "only", amount: 13 }]);
  });
});

describe("flattenLoanMovements", () => {
  it("returns no rows for an empty list", () => {
    expect(flattenLoanMovements([])).toEqual([]);
  });

  it("maps disbursements and payments with their derived fields", () => {
    const loan = makeLoan({
      id: "l1",
      personName: "Ana",
      direction: "borrowed",
      currency: "USD",
      isSettled: false,
      disbursements: [
        {
          id: "d-settled",
          loanId: "l1",
          amount: 100,
          occurredOn: "2026-01-10",
          description: "inicial",
          notes: null,
          interestRate: 5,
          outstandingAmount: 0,
        },
        {
          id: "d-open",
          loanId: "l1",
          amount: 200,
          occurredOn: "2026-01-20",
          description: "extra",
          notes: "nota",
          interestRate: 8,
          outstandingAmount: 50,
        },
      ],
      payments: [
        {
          id: "p1",
          loanId: "l1",
          disbursementId: "d-settled",
          amount: 30,
          occurredOn: "2026-01-20",
          notes: null,
        },
        {
          id: "p2",
          loanId: "l1",
          disbursementId: "missing",
          amount: 10,
          occurredOn: "2026-01-15",
          notes: null,
        },
      ],
    });

    const rows = flattenLoanMovements([loan]);

    expect(rows.map((row) => row.id)).toEqual([
      "d-open",
      "p1",
      "p2",
      "d-settled",
    ]);

    expect(rows[0]).toMatchObject({
      kind: "disbursement",
      personName: "Ana",
      direction: "borrowed",
      currency: "USD",
      isSettled: false,
      pendingAmount: 50,
      interestRate: 8,
    });

    expect(rows[3]).toMatchObject({
      kind: "disbursement",
      isSettled: true,
      pendingAmount: 0,
    });

    expect(rows[1]).toMatchObject({
      kind: "payment",
      amount: 30,
      description: "inicial",
      isSettled: false,
      pendingAmount: 0,
      interestRate: 0,
    });

    expect(rows[2]).toMatchObject({
      kind: "payment",
      description: null,
    });
  });

  it("sorts rows by date descending and disbursement before payment on ties", () => {
    const loan = makeLoan({
      disbursements: [
        {
          id: "d1",
          loanId: "loan-1",
          amount: 100,
          occurredOn: "2026-01-01",
          description: null,
          notes: null,
          interestRate: 0,
          outstandingAmount: 100,
        },
      ],
      payments: [
        {
          id: "p1",
          loanId: "loan-1",
          disbursementId: "d1",
          amount: 10,
          occurredOn: "2026-01-01",
          notes: null,
        },
      ],
    });

    const rows = flattenLoanMovements([loan]);

    expect(rows.map((row) => row.id)).toEqual(["d1", "p1"]);
  });

  it("flattens movements across several loans", () => {
    const rows = flattenLoanMovements([
      makeLoan({
        id: "l1",
        personName: "Ana",
        disbursements: [
          {
            id: "a-d",
            loanId: "l1",
            amount: 100,
            occurredOn: "2026-01-01",
            description: null,
            notes: null,
            interestRate: 0,
            outstandingAmount: 100,
          },
        ],
      }),
      makeLoan({
        id: "l2",
        personName: "Zoe",
        disbursements: [
          {
            id: "z-d",
            loanId: "l2",
            amount: 300,
            occurredOn: "2026-02-01",
            description: null,
            notes: null,
            interestRate: 0,
            outstandingAmount: 300,
          },
        ],
      }),
    ]);

    expect(rows.map((row) => row.id)).toEqual(["z-d", "a-d"]);
    expect(rows.map((row) => row.personName)).toEqual(["Zoe", "Ana"]);
  });
});
