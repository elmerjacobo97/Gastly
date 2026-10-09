import { describe, expect, it } from "vitest";

import { computeSummary } from "@/features/transactions/lib/transactions-api";
import { type Transaction } from "@/lib/transaction-types";

function makeTransaction(overrides: Partial<Transaction>): Transaction {
  return {
    id: "transaction-1",
    type: "expense",
    amount: 0,
    currency: "PEN",
    description: "Movimiento",
    occurredOn: "2026-10-01",
    notes: null,
    category: null,
    recurringExpenseId: null,
    paymentMethod: "cash",
    creditCardName: null,
    creditCardDueOn: null,
    creditCardPaidOn: null,
    ...overrides,
  };
}

describe("computeSummary", () => {
  it("calculates balances per currency without combining amounts", () => {
    expect(
      computeSummary([
        makeTransaction({ type: "income", amount: 100, currency: "PEN" }),
        makeTransaction({ type: "expense", amount: 20, currency: "PEN" }),
        makeTransaction({ type: "income", amount: 15, currency: "USD" }),
        makeTransaction({ type: "expense", amount: 30, currency: "USD" }),
      ]),
    ).toEqual({
      balance: { PEN: 80, USD: -15 },
      income: { PEN: 100, USD: 15 },
      expenses: { PEN: 20, USD: 30 },
      budgetUsage: { PEN: 20, USD: 200 },
    });
  });
});
