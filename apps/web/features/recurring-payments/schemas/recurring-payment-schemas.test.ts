import { describe, expect, it } from "vitest";

import {
  recurringPaymentActiveSchema,
  recurringPaymentIdSchema,
  recurringPaymentPaymentSchema,
  recurringPaymentRefSchema,
  recurringPaymentSchema,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas";

const validPayment = {
  description: "Netflix",
  amount: "35.9",
  categoryId: "cat-1",
  frequency: "monthly",
  intervalMonths: "1",
  paymentKind: "fixed",
  nextDueOn: "2026-02-01",
  type: "expense",
};

describe("recurringPaymentSchema", () => {
  it("parses a valid monthly payment and coerces numeric fields", () => {
    const parsed = recurringPaymentSchema.parse(validPayment);

    expect(parsed).toEqual({
      description: "Netflix",
      amount: 35.9,
      categoryId: "cat-1",
      frequency: "monthly",
      intervalMonths: 1,
      paymentKind: "fixed",
      nextDueOn: "2026-02-01",
      type: "expense",
    });
  });

  it("accepts a custom month interval with optional fields", () => {
    const parsed = recurringPaymentSchema.parse({
      ...validPayment,
      description: "  Mantenimiento  ",
      frequency: "custom_months",
      intervalMonths: 3,
      paymentKind: "variable",
      accountId: "acc-1",
      notes: "  sube cada trimestre  ",
    });

    expect(parsed.description).toBe("Mantenimiento");
    expect(parsed.intervalMonths).toBe(3);
    expect(parsed.accountId).toBe("acc-1");
    expect(parsed.notes).toBe("sube cada trimestre");
  });

  it("accepts a yearly income payment", () => {
    const parsed = recurringPaymentSchema.parse({
      ...validPayment,
      frequency: "yearly",
      intervalMonths: "12",
      type: "income",
    });

    expect(parsed.frequency).toBe("yearly");
    expect(parsed.type).toBe("income");
  });

  it("rejects an empty description", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      description: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Ingresa un nombre.");
    }
  });

  it("rejects a description shorter than 2 characters", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      description: "N",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Ingresa un nombre.");
    }
  });

  it("rejects a zero amount", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      amount: "0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto estimado debe ser mayor a 0.",
      );
    }
  });

  it("rejects a negative amount", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      amount: "-5",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto estimado debe ser mayor a 0.",
      );
    }
  });

  it("rejects a non numeric amount", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      amount: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty category", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      categoryId: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Selecciona una categoria.");
    }
  });

  it("rejects an unknown frequency", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      frequency: "weekly",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an interval of zero", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      intervalMonths: "0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El intervalo debe ser al menos 1 mes.",
      );
    }
  });

  it("rejects an interval above 120 months", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      intervalMonths: "121",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El intervalo no puede ser mayor a 120 meses.",
      );
    }
  });

  it("rejects a decimal interval", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      intervalMonths: "1.5",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El intervalo debe ser un numero entero.",
      );
    }
  });

  it("rejects an unknown payment kind", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      paymentKind: "mixed",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty next due date", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      nextDueOn: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona la proxima fecha de pago.",
      );
    }
  });

  it("rejects an unknown type", () => {
    const result = recurringPaymentSchema.safeParse({
      ...validPayment,
      type: "transfer",
    });

    expect(result.success).toBe(false);
  });
});

describe("recurringPaymentPaymentSchema", () => {
  it("parses a valid payment", () => {
    expect(
      recurringPaymentPaymentSchema.parse({
        amount: "35.9",
        occurredOn: "2026-02-03",
        notes: "  pagado  ",
      }),
    ).toEqual({
      amount: 35.9,
      occurredOn: "2026-02-03",
      notes: "pagado",
    });
  });

  it("rejects a zero amount", () => {
    const result = recurringPaymentPaymentSchema.safeParse({
      amount: "0",
      occurredOn: "2026-02-03",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto real debe ser mayor a 0.",
      );
    }
  });

  it("rejects a non numeric amount", () => {
    const result = recurringPaymentPaymentSchema.safeParse({
      amount: "abc",
      occurredOn: "2026-02-03",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty date", () => {
    const result = recurringPaymentPaymentSchema.safeParse({
      amount: "10",
      occurredOn: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona la fecha de pago.",
      );
    }
  });
});

describe("recurring payment id and active schemas", () => {
  it("accepts a valid uuid", () => {
    expect(
      recurringPaymentIdSchema.parse("3f2504e0-4f89-41d3-9a0c-0305e82c3301"),
    ).toBe("3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  });

  it("rejects an invalid uuid", () => {
    const result = recurringPaymentIdSchema.safeParse("rec-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona un pago recurrente válido.",
      );
    }
  });

  it("accepts booleans for the active flag", () => {
    expect(recurringPaymentActiveSchema.parse(true)).toBe(true);
    expect(recurringPaymentActiveSchema.parse(false)).toBe(false);
  });

  it("rejects a non boolean active flag", () => {
    const result = recurringPaymentActiveSchema.safeParse("true");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona un estado válido.",
      );
    }
  });
});

describe("recurringPaymentRefSchema", () => {
  const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

  const validRef = {
    id,
    type: "expense",
    description: "Netflix",
    frequency: "monthly",
    intervalMonths: "1",
    nextDueOn: "2026-02-01",
    notes: null,
    category: { id },
    accountId: id,
  };

  it("parses a valid ref and coerces the interval", () => {
    expect(recurringPaymentRefSchema.parse(validRef)).toEqual({
      ...validRef,
      intervalMonths: 1,
    });
  });

  it("accepts a null category and null account", () => {
    const parsed = recurringPaymentRefSchema.parse({
      ...validRef,
      category: null,
      accountId: null,
    });

    expect(parsed.category).toBeNull();
    expect(parsed.accountId).toBeNull();
  });

  it("rejects an invalid id", () => {
    expect(
      recurringPaymentRefSchema.safeParse({ ...validRef, id: "rec-1" }).success,
    ).toBe(false);
  });

  it("rejects an invalid nested category id", () => {
    expect(
      recurringPaymentRefSchema.safeParse({
        ...validRef,
        category: { id: "cat-1" },
      }).success,
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(
      recurringPaymentRefSchema.safeParse({ ...validRef, description: "" })
        .success,
    ).toBe(false);
  });

  it("rejects a zero interval", () => {
    expect(
      recurringPaymentRefSchema.safeParse({
        ...validRef,
        intervalMonths: "0",
      }).success,
    ).toBe(false);
  });

  it("rejects an unknown frequency", () => {
    expect(
      recurringPaymentRefSchema.safeParse({
        ...validRef,
        frequency: "weekly",
      }).success,
    ).toBe(false);
  });
});
