import { describe, expect, it } from "vitest";

import {
  transactionIdSchema,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas";

const validTransaction = {
  type: "expense",
  amount: "45.9",
  description: "Almuerzo",
  categoryName: "Comida",
  occurredOn: "2026-05-10",
};

describe("transactionSchema account fields", () => {
  const accountId = "123e4567-e89b-12d3-a456-426614174000";

  it("accepts an account with its amount", () => {
    const parsed = transactionSchema.parse({
      ...validTransaction,
      accountId,
      accountAmount: "27.5",
    });

    expect(parsed.accountId).toBe(accountId);
    expect(parsed.accountAmount).toBe(27.5);
  });

  it("accepts an empty account, meaning none", () => {
    expect(
      transactionSchema.parse({ ...validTransaction, accountId: "" }).accountId,
    ).toBe("");
  });

  it("rejects an invalid account id", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      accountId: "acc-1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a zero account amount", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      accountId,
      accountAmount: "0",
    });

    expect(result.success).toBe(false);
  });
});

describe("transactionSchema", () => {
  it("parses a valid expense and coerces the amount", () => {
    expect(transactionSchema.parse(validTransaction)).toEqual({
      type: "expense",
      amount: 45.9,
      currency: "PEN",
      description: "Almuerzo",
      categoryName: "Comida",
      occurredOn: "2026-05-10",
    });
  });

  it("parses an income with trimmed notes", () => {
    const parsed = transactionSchema.parse({
      ...validTransaction,
      type: "income",
      amount: 100,
      notes: "  reembolso  ",
    });

    expect(parsed.type).toBe("income");
    expect(parsed.notes).toBe("reembolso");
  });

  it("trims description and category name", () => {
    const parsed = transactionSchema.parse({
      ...validTransaction,
      description: "  Almuerzo  ",
      categoryName: "  Comida  ",
    });

    expect(parsed.description).toBe("Almuerzo");
    expect(parsed.categoryName).toBe("Comida");
  });

  it("rejects an unknown type", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      type: "transfer",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a zero amount", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      amount: "0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa un monto mayor a 0.",
      );
    }
  });

  it("rejects a negative amount", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      amount: "-10",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa un monto mayor a 0.",
      );
    }
  });

  it("rejects a non numeric amount", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      amount: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a boolean amount", () => {
    expect(
      transactionSchema.safeParse({ ...validTransaction, amount: true })
        .success,
    ).toBe(false);
  });

  it("rejects a short description", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      description: "A",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Describe la transacción.");
    }
  });

  it("rejects a short category name", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      categoryName: "C",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Ingresa una categoria.");
    }
  });

  it("rejects an empty date", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      occurredOn: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Selecciona una fecha.");
    }
  });

  it("accepts supported currencies and rejects unsupported ones", () => {
    expect(
      transactionSchema.parse({ ...validTransaction, currency: "USD" })
        .currency,
    ).toBe("USD");
    expect(
      transactionSchema.safeParse({ ...validTransaction, currency: "EUR" })
        .success,
    ).toBe(false);
  });
});

describe("transactionIdSchema", () => {
  it("accepts a valid uuid", () => {
    expect(
      transactionIdSchema.parse("3f2504e0-4f89-41d3-9a0c-0305e82c3301"),
    ).toBe("3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  });

  it("rejects a non uuid string", () => {
    const result = transactionIdSchema.safeParse("tx-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona una transacción válida.",
      );
    }
  });
});
