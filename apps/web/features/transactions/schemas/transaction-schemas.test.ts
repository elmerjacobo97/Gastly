import { describe, expect, it } from "vitest";

import {
  creditCardNameSchema,
  transactionIdSchema,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas";

const validTransaction = {
  type: "expense",
  amount: "45.9",
  description: "Almuerzo",
  categoryName: "Comida",
  occurredOn: "2026-05-10",
  paymentMethod: "cash",
};

describe("transactionSchema", () => {
  it("parses a valid expense and coerces the amount", () => {
    expect(transactionSchema.parse(validTransaction)).toEqual({
      type: "expense",
      amount: 45.9,
      description: "Almuerzo",
      categoryName: "Comida",
      occurredOn: "2026-05-10",
      paymentMethod: "cash",
    });
  });

  it("parses a credit card payment with optional fields", () => {
    const parsed = transactionSchema.parse({
      ...validTransaction,
      type: "income",
      amount: 100,
      paymentMethod: "credit_card",
      creditCardName: "Visa",
      creditCardDueOn: "2026-06-01",
      notes: "  reembolso  ",
    });

    expect(parsed.paymentMethod).toBe("credit_card");
    expect(parsed.creditCardName).toBe("Visa");
    expect(parsed.creditCardDueOn).toBe("2026-06-01");
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

  it("rejects an unknown payment method", () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      paymentMethod: "yape",
    });

    expect(result.success).toBe(false);
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

describe("creditCardNameSchema", () => {
  it("accepts a non empty name and trims it", () => {
    expect(creditCardNameSchema.parse("  Visa  ")).toBe("Visa");
  });

  it("accepts null", () => {
    expect(creditCardNameSchema.parse(null)).toBeNull();
  });

  it("rejects an empty name", () => {
    const result = creditCardNameSchema.safeParse("   ");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona una tarjeta válida.",
      );
    }
  });

  it("rejects undefined", () => {
    expect(creditCardNameSchema.safeParse(undefined).success).toBe(false);
  });
});
