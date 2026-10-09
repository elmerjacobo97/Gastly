import { describe, expect, it } from "vitest";

import {
  categoryBudgetSchema,
  monthlyBudgetTotalSchema,
} from "@/features/budgets/schemas/budget-schemas";

describe("budget schemas", () => {
  it("accepts per-category and total budgets in supported currencies", () => {
    expect(
      categoryBudgetSchema.parse({
        categoryId: "123e4567-e89b-12d3-a456-426614174000",
        month: "2026-10",
        currency: "USD",
        amount: "250.50",
      }),
    ).toMatchObject({ amount: 250.5, currency: "USD" });
    expect(
      monthlyBudgetTotalSchema.parse({
        month: "2026-10",
        currency: "PEN",
        amount: 1000,
      }).amount,
    ).toBe(1000);
  });

  it("rejects income-independent invalid months, currencies, and amounts", () => {
    expect(
      monthlyBudgetTotalSchema.safeParse({
        month: "2026-13",
        currency: "PEN",
        amount: 100,
      }).success,
    ).toBe(false);
    expect(
      monthlyBudgetTotalSchema.safeParse({
        month: "2026-10",
        currency: "EUR",
        amount: 100,
      }).success,
    ).toBe(false);
    expect(
      monthlyBudgetTotalSchema.safeParse({
        month: "2026-10",
        currency: "PEN",
        amount: 0,
      }).success,
    ).toBe(false);
  });
});
