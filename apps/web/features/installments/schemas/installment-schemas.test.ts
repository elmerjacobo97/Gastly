import { describe, expect, it } from "vitest";

import {
  installmentPurchaseIdSchema,
  installmentPurchaseSchema,
  paidInstallmentsCountSchema,
  payInstallmentsSchema,
  pendingInstallmentsSchema,
} from "@/features/installments/schemas/installment-schemas";

const validPurchase = {
  description: "Laptop",
  categoryId: "cat-1",
  totalAmount: "1200",
  interestAmount: "0",
  totalInstallments: "6",
  firstPaymentOn: "2026-01-10",
  alreadyPaid: "0",
};

describe("installmentPurchaseSchema", () => {
  it("parses a valid purchase and coerces numeric fields", () => {
    const parsed = installmentPurchaseSchema.parse(validPurchase);

    expect(parsed).toEqual({
      description: "Laptop",
      categoryId: "cat-1",
      totalAmount: 1200,
      interestAmount: 0,
      totalInstallments: 6,
      firstPaymentOn: "2026-01-10",
      alreadyPaid: 0,
    });
  });

  it("accepts real numbers and optional fields", () => {
    const parsed = installmentPurchaseSchema.parse({
      ...validPurchase,
      totalAmount: 500,
      interestAmount: 25,
      totalInstallments: 12,
      alreadyPaid: 3,
      accountId: "acc-1",
      notes: "  sin seguro  ",
    });

    expect(parsed.totalInstallments).toBe(12);
    expect(parsed.alreadyPaid).toBe(3);
    expect(parsed.accountId).toBe("acc-1");
    expect(parsed.notes).toBe("sin seguro");
  });

  it("rejects an empty description", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      description: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Ingresa una descripción.");
    }
  });

  it("rejects a description shorter than 2 characters", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      description: "L",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Ingresa una descripción.");
    }
  });

  it("rejects a missing category", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      categoryId: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Selecciona una categoría.");
    }
  });

  it("rejects a zero total amount", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      totalAmount: "0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto total debe ser mayor a 0.",
      );
    }
  });

  it("rejects a negative total amount", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      totalAmount: "-100",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto total debe ser mayor a 0.",
      );
    }
  });

  it("rejects a non numeric total amount", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      totalAmount: "abc",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a negative interest amount", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      interestAmount: "-1",
    });

    expect(result.success).toBe(false);
  });

  it("rejects fewer than 2 installments", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      totalInstallments: "1",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Mínimo 2 cuotas.");
    }
  });

  it("rejects more than 60 installments", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      totalInstallments: "61",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Máximo 60 cuotas.");
    }
  });

  it("rejects a decimal installment count", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      totalInstallments: "2.5",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Debe ser un número entero.",
      );
    }
  });

  it("rejects a non numeric installment count", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      totalInstallments: "seis",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty first payment date", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      firstPaymentOn: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona la fecha del primer pago.",
      );
    }
  });

  it("rejects alreadyPaid equal to the total installments", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      alreadyPaid: "6",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Las cuotas ya pagadas deben ser menos que el total.",
      );
    }
  });

  it("rejects a negative alreadyPaid", () => {
    const result = installmentPurchaseSchema.safeParse({
      ...validPurchase,
      alreadyPaid: "-1",
    });

    expect(result.success).toBe(false);
  });
});

describe("payInstallmentsSchema", () => {
  it("accepts a non empty date", () => {
    expect(payInstallmentsSchema.parse({ occurredOn: "2026-02-01" })).toEqual({
      occurredOn: "2026-02-01",
    });
  });

  it("rejects an empty date", () => {
    const result = payInstallmentsSchema.safeParse({ occurredOn: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona la fecha de pago.",
      );
    }
  });

  it("rejects a missing date", () => {
    expect(payInstallmentsSchema.safeParse({}).success).toBe(false);
  });
});

describe("paidInstallmentsCountSchema", () => {
  it("accepts zero and coerces numeric strings", () => {
    expect(paidInstallmentsCountSchema.parse("0")).toBe(0);
    expect(paidInstallmentsCountSchema.parse(3)).toBe(3);
  });

  it("rejects a negative count", () => {
    const result = paidInstallmentsCountSchema.safeParse("-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Las cuotas pagadas no pueden ser negativas.",
      );
    }
  });

  it("rejects a decimal count", () => {
    const result = paidInstallmentsCountSchema.safeParse("1.5");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Las cuotas pagadas deben ser un número entero.",
      );
    }
  });

  it("rejects non numeric input", () => {
    expect(paidInstallmentsCountSchema.safeParse("abc").success).toBe(false);
  });
});

describe("installmentPurchaseIdSchema", () => {
  it("accepts a valid uuid", () => {
    expect(
      installmentPurchaseIdSchema.parse("3f2504e0-4f89-41d3-9a0c-0305e82c3301"),
    ).toBe("3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  });

  it("rejects a non uuid string", () => {
    const result = installmentPurchaseIdSchema.safeParse("purchase-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona una compra válida.",
      );
    }
  });
});

describe("pendingInstallmentsSchema", () => {
  const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

  const validPending = [
    {
      payment: { id, amount: "100", paymentNumber: "1" },
      purchase: {
        id,
        description: "Laptop",
        totalInstallments: "6",
        accountId: id,
        category: { id },
      },
    },
  ];

  it("parses a valid pending installment list and coerces numbers", () => {
    const parsed = pendingInstallmentsSchema.parse(validPending);

    expect(parsed).toEqual([
      {
        payment: { id, amount: 100, paymentNumber: 1 },
        purchase: {
          id,
          description: "Laptop",
          totalInstallments: 6,
          accountId: id,
          category: { id },
        },
      },
    ]);
  });

  it("accepts a null account and null category", () => {
    const parsed = pendingInstallmentsSchema.parse([
      {
        payment: { id, amount: 50, paymentNumber: 2 },
        purchase: {
          id,
          description: "Laptop",
          totalInstallments: 6,
          accountId: null,
          category: null,
        },
      },
    ]);

    expect(parsed[0]?.purchase.accountId).toBeNull();
    expect(parsed[0]?.purchase.category).toBeNull();
  });

  it("rejects an empty list entry", () => {
    expect(pendingInstallmentsSchema.safeParse([]).success).toBe(true);
    expect(pendingInstallmentsSchema.safeParse([{}]).success).toBe(false);
  });

  it("rejects a non numeric payment amount", () => {
    const result = pendingInstallmentsSchema.safeParse([
      {
        ...validPending[0],
        payment: { id, amount: "abc", paymentNumber: "1" },
      },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects a non uuid purchase id", () => {
    const result = pendingInstallmentsSchema.safeParse([
      {
        ...validPending[0],
        purchase: { ...validPending[0]?.purchase, id: "purchase-1" },
      },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects a non array value", () => {
    expect(pendingInstallmentsSchema.safeParse(validPending[0]).success).toBe(
      false,
    );
  });
});
