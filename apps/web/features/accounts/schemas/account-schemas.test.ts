import { describe, expect, it } from "vitest";

import { accountSchema } from "@/features/accounts/schemas/account-schemas";

const validAccount = {
  name: "Ahorros",
  balance: "1500.50",
  color: "#3b82f6",
};

describe("accountSchema", () => {
  it("parses a valid account and coerces the balance to a number", () => {
    const parsed = accountSchema.parse(validAccount);

    expect(parsed).toEqual({
      name: "Ahorros",
      balance: 1500.5,
      color: "#3b82f6",
    });
  });

  it("accepts a real number balance", () => {
    expect(accountSchema.parse({ ...validAccount, balance: 0 }).balance).toBe(
      0,
    );
  });

  it("trims the name and notes", () => {
    const parsed = accountSchema.parse({
      ...validAccount,
      name: "  Banco  ",
      notes: "  cuenta principal  ",
    });

    expect(parsed.name).toBe("Banco");
    expect(parsed.notes).toBe("cuenta principal");
  });

  it("rejects an empty name", () => {
    const result = accountSchema.safeParse({ ...validAccount, name: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el nombre de la cuenta.",
      );
    }
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = accountSchema.safeParse({ ...validAccount, name: "A" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el nombre de la cuenta.",
      );
    }
  });

  it("rejects a negative balance", () => {
    const result = accountSchema.safeParse({ ...validAccount, balance: "-5" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El saldo no puede ser negativo.",
      );
    }
  });

  it("rejects a non numeric balance", () => {
    const result = accountSchema.safeParse({ ...validAccount, balance: "abc" });

    expect(result.success).toBe(false);
  });

  it("rejects a missing balance", () => {
    const result = accountSchema.safeParse({
      name: "Ahorros",
      color: "#3b82f6",
    });

    expect(result.success).toBe(false);
  });
});
