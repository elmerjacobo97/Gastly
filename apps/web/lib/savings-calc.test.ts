import { describe, expect, it } from "vitest";

import { type MonthlyPlan } from "@/lib/monthly-plan-types";
import { calculateSavings } from "@/lib/savings-calc";

function plan(overrides: Partial<MonthlyPlan> = {}): MonthlyPlan {
  return {
    id: "plan-1",
    month: "2026-01-01",
    savingsMode: "percent",
    savingsValue: 10,
    notes: null,
    ...overrides,
  };
}

describe("calculateSavings", () => {
  it("returns 0 when there is no plan", () => {
    expect(calculateSavings(null, 1000)).toBe(0);
  });

  it("returns a percentage of the actual income", () => {
    expect(
      calculateSavings(
        plan({ savingsMode: "percent", savingsValue: 15 }),
        2000,
      ),
    ).toBe(300);
  });

  it("rounds percentage results to two decimals", () => {
    expect(
      calculateSavings(
        plan({ savingsMode: "percent", savingsValue: 10 }),
        333.333,
      ),
    ).toBe(33.33);
  });

  it("returns the fixed amount in amount mode", () => {
    expect(
      calculateSavings(
        plan({ savingsMode: "amount", savingsValue: 250 }),
        2000,
      ),
    ).toBe(250);
  });

  it("ignores the income in amount mode", () => {
    expect(
      calculateSavings(plan({ savingsMode: "amount", savingsValue: 250 }), 0),
    ).toBe(250);
  });
});
