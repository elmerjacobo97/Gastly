import { describe, expect, it } from "vitest";

import {
  aggregateBudgetExpenses,
  aggregatePendingPayments,
  calculateBudgetProgress,
} from "@/features/budgets/lib/budget-calculations";

describe("aggregateBudgetExpenses", () => {
  it("keeps currencies separate and includes uncategorized expenses in totals", () => {
    expect(
      aggregateBudgetExpenses([
        { categoryId: "food", amount: 30, currency: "PEN" },
        { categoryId: "food", amount: 20, currency: "PEN" },
        { categoryId: "food", amount: 10, currency: "USD" },
        { categoryId: null, amount: 7, currency: "PEN" },
      ]),
    ).toEqual({
      totalByCurrency: { PEN: 57, USD: 10 },
      categoryByCurrency: { "food:PEN": 50, "food:USD": 10 },
    });
  });
});

describe("calculateBudgetProgress", () => {
  it("reports remaining, warning, and over-budget progress", () => {
    expect(calculateBudgetProgress(100, 80)).toEqual({
      remaining: 20,
      percentage: 80,
      spentPercentage: 80,
      barPercentage: 80,
      spentBarPercentage: 80,
      isOverBudget: false,
      isNearLimit: true,
    });
    expect(calculateBudgetProgress(100, 125)).toEqual({
      remaining: -25,
      percentage: 125,
      spentPercentage: 125,
      barPercentage: 100,
      spentBarPercentage: 100,
      isOverBudget: true,
      isNearLimit: false,
    });
  });

  it("counts committed amount in remaining and percentage", () => {
    expect(calculateBudgetProgress(500, 50, 300)).toMatchObject({
      remaining: 150,
      percentage: 70,
      spentPercentage: 10,
      isOverBudget: false,
    });
  });
});

describe("aggregatePendingPayments", () => {
  const base = { currency: "PEN" as const, nextDueOn: "2026-10-15" };

  it("skips paid and out-of-month non-monthly payments", () => {
    expect(
      aggregatePendingPayments(
        [
          {
            ...base,
            id: "a",
            categoryId: "food",
            amount: 300,
            frequency: "monthly",
          },
          {
            ...base,
            id: "b",
            categoryId: "food",
            amount: 100,
            frequency: "monthly",
          },
          {
            ...base,
            id: "c",
            categoryId: "food",
            amount: 50,
            frequency: "yearly",
            nextDueOn: "2027-01-10",
          },
          {
            ...base,
            id: "d",
            categoryId: null,
            amount: 20,
            frequency: "yearly",
          },
        ],
        new Set(["b"]),
        "2026-10",
      ),
    ).toEqual({
      totalByCurrency: { PEN: 320 },
      categoryByCurrency: { "food:PEN": 300 },
    });
  });
});
