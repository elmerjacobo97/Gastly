import { describe, expect, it } from "vitest";

import { buildAccountStatement } from "@/features/loans/lib/account-statement";
import {
  type LoanMovementRow,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

const pen = (value: number) => formatCurrency(value, "PEN");

function movement(overrides: Partial<LoanMovementRow>): LoanMovementRow {
  return {
    id: "m1",
    kind: "disbursement",
    loanId: "l1",
    personName: "Richard Cruz",
    direction: "lent",
    expectedOn: null,
    currency: "PEN",
    amount: 100,
    occurredOn: "2026-09-03",
    description: null,
    notes: null,
    isSettled: false,
    pendingAmount: 100,
    interestRate: 0,
    ...overrides,
  };
}

const group: LoanPersonGroup = {
  key: "richard cruz",
  personName: "Richard Cruz",
  balances: [],
  totals: [{ currency: "PEN", lent: 333.97, borrowed: 13, net: 320.97 }],
  isSettled: false,
};

const today = new Date("2026-10-14T12:00:00");

describe("buildAccountStatement", () => {
  it("lists only pending disbursements, split by who benefits, with the net balance", () => {
    const text = buildAccountStatement({
      group,
      ownerName: "Elmer",
      today,
      movements: [
        movement({
          id: "a",
          description: "Repisa recta Facility",
          amount: 47.4,
          pendingAmount: 47.4,
        }),
        movement({ id: "paid", pendingAmount: 0, isSettled: true }),
        movement({ id: "pay", kind: "payment", pendingAmount: 0 }),
        movement({
          id: "b",
          direction: "borrowed",
          description: "Pollo a la brasa",
          amount: 13,
          pendingAmount: 13,
          occurredOn: "2026-10-12",
        }),
      ],
    });

    expect(text).toContain("*Estado de cuenta · Elmer y Richard Cruz*");
    expect(text).toContain("*Richard Cruz debe a Elmer*");
    expect(text).toContain(`Repisa recta Facility · ${pen(47.4)}`);
    expect(text).toContain("*Elmer debe a Richard Cruz*");
    expect(text).toContain(`Pollo a la brasa · ${pen(13)}`);
    expect(text).toContain(
      `${pen(333.97)} − ${pen(13)} = *Richard Cruz debe ${pen(320.97)}*`,
    );
    expect(text.match(/•/g)).toHaveLength(2);
  });

  it("shows partial payments and interest", () => {
    const text = buildAccountStatement({
      group,
      ownerName: "Elmer",
      today,
      movements: [
        movement({ id: "a", amount: 100, pendingAmount: 60 }),
        movement({ id: "b", amount: 100, pendingAmount: 110 }),
      ],
    });

    expect(text).toContain(`${pen(60)} pendientes de ${pen(100)}`);
    expect(text).toContain(`${pen(110)} con interés`);
  });

  it("names the person when the net favors them", () => {
    const text = buildAccountStatement({
      group: {
        ...group,
        totals: [{ currency: "PEN", lent: 0, borrowed: 1150, net: -1150 }],
      },
      ownerName: "Elmer",
      today,
      movements: [
        movement({ direction: "borrowed", amount: 1500, pendingAmount: 1150 }),
      ],
    });

    expect(text).toContain(`*Elmer debe ${pen(1150)}*`);
    expect(text).not.toContain("*Richard Cruz debe a Elmer*");
  });

  it("says so when nothing is pending", () => {
    expect(
      buildAccountStatement({
        group,
        ownerName: "Elmer",
        today,
        movements: [],
      }),
    ).toContain("Sin saldos pendientes.");
  });
});
