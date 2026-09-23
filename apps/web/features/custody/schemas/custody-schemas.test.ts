import { describe, expect, it } from "vitest";

import {
  custodyMovementIdSchema,
  custodyMovementSchema,
  custodyOrderIdSchema,
  custodyOrderSchema,
  custodyOrderStatusSchema,
} from "@/features/custody/schemas/custody-schemas";

describe("custodyOrderSchema", () => {
  it("parses a valid order and coerces the target amount", () => {
    const parsed = custodyOrderSchema.parse({
      personName: "  Maria  ",
      title: "Encargo de pasajes",
      targetAmount: "250.75",
      expectedOn: "2026-03-01",
      notes: "  pagar en efectivo  ",
    });

    expect(parsed).toEqual({
      personName: "Maria",
      title: "Encargo de pasajes",
      targetAmount: 250.75,
      expectedOn: "2026-03-01",
      notes: "pagar en efectivo",
    });
  });

  it("accepts an order without optional fields", () => {
    const parsed = custodyOrderSchema.parse({
      personName: "Maria",
      title: "Encargo",
    });

    expect(parsed.targetAmount).toBeUndefined();
    expect(parsed.expectedOn).toBeUndefined();
  });

  it("rejects an empty person name", () => {
    const result = custodyOrderSchema.safeParse({
      personName: "",
      title: "Encargo",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el nombre de la persona.",
      );
    }
  });

  it("rejects a title shorter than 2 characters", () => {
    const result = custodyOrderSchema.safeParse({
      personName: "Maria",
      title: "E",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el propósito del encargo.",
      );
    }
  });

  it("rejects a negative target amount", () => {
    const result = custodyOrderSchema.safeParse({
      personName: "Maria",
      title: "Encargo",
      targetAmount: "-10",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a non numeric target amount", () => {
    const result = custodyOrderSchema.safeParse({
      personName: "Maria",
      title: "Encargo",
      targetAmount: "abc",
    });

    expect(result.success).toBe(false);
  });
});

describe("custodyMovementSchema", () => {
  const validMovement = {
    type: "deposit",
    amount: "50.25",
    occurredOn: "2026-03-05",
    method: "yape",
  };

  it("parses a valid deposit and coerces the amount", () => {
    expect(custodyMovementSchema.parse(validMovement)).toEqual({
      type: "deposit",
      amount: 50.25,
      occurredOn: "2026-03-05",
      method: "yape",
    });
  });

  it("accepts a disbursement without a method", () => {
    const parsed = custodyMovementSchema.parse({
      type: "disbursement",
      amount: 100,
      occurredOn: "2026-03-06",
    });

    expect(parsed.type).toBe("disbursement");
    expect(parsed.method).toBeUndefined();
  });

  it("rejects an unknown movement type", () => {
    const result = custodyMovementSchema.safeParse({
      ...validMovement,
      type: "withdrawal",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an amount of zero", () => {
    const result = custodyMovementSchema.safeParse({
      ...validMovement,
      amount: "0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto debe ser mayor a 0.",
      );
    }
  });

  it("rejects a negative amount", () => {
    const result = custodyMovementSchema.safeParse({
      ...validMovement,
      amount: -1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto debe ser mayor a 0.",
      );
    }
  });

  it("rejects a non numeric amount", () => {
    const result = custodyMovementSchema.safeParse({
      ...validMovement,
      amount: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty date", () => {
    const result = custodyMovementSchema.safeParse({
      ...validMovement,
      occurredOn: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Selecciona la fecha.");
    }
  });

  it("rejects an unknown payment method", () => {
    const result = custodyMovementSchema.safeParse({
      ...validMovement,
      method: "card",
    });

    expect(result.success).toBe(false);
  });
});

describe("custody id and status schemas", () => {
  it("accepts valid uuids", () => {
    const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

    expect(custodyOrderIdSchema.parse(id)).toBe(id);
    expect(custodyMovementIdSchema.parse(id)).toBe(id);
  });

  it("rejects invalid uuids", () => {
    expect(custodyOrderIdSchema.safeParse("order-1").success).toBe(false);
    expect(custodyMovementIdSchema.safeParse("mov-1").success).toBe(false);
  });

  it("accepts known order statuses", () => {
    expect(custodyOrderStatusSchema.parse("active")).toBe("active");
    expect(custodyOrderStatusSchema.parse("completed")).toBe("completed");
    expect(custodyOrderStatusSchema.parse("cancelled")).toBe("cancelled");
  });

  it("rejects an unknown order status", () => {
    const result = custodyOrderStatusSchema.safeParse("pending");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona un estado válido.",
      );
    }
  });
});
