import { describe, expect, it } from "vitest";

import { getAccountForAmount } from "@/features/transactions/lib/account-amount";
import { type Account } from "@/lib/account-types";

function makeAccount(overrides: Partial<Account>): Account {
  return {
    id: "acc-1",
    name: "BCP débito",
    currency: "PEN",
    balance: 0,
    color: "#3b82f6",
    notes: null,
    createdAt: "2026-10-01T00:00:00Z",
    ...overrides,
  };
}

describe("getAccountForAmount", () => {
  const usd = makeAccount({ id: "usd", currency: "USD" });
  const pen = makeAccount({ id: "pen", currency: "PEN" });

  it("returns the account when its currency differs", () => {
    expect(
      getAccountForAmount([usd, pen], { accountId: "usd", currency: "PEN" }),
    ).toBe(usd);
  });

  it("returns null when the currencies match", () => {
    expect(
      getAccountForAmount([usd, pen], { accountId: "pen", currency: "PEN" }),
    ).toBeNull();
  });

  it("returns null without an account or with an unknown one", () => {
    expect(
      getAccountForAmount([usd], { accountId: "", currency: "PEN" }),
    ).toBeNull();
    expect(
      getAccountForAmount([usd], { accountId: undefined, currency: "PEN" }),
    ).toBeNull();
    expect(
      getAccountForAmount([usd], { accountId: "x", currency: "PEN" }),
    ).toBeNull();
  });
});
