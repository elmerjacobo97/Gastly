import { describe, expect, it } from "vitest";

import {
  addLoanSchema,
  editLoanPersonSchema,
  loanDisbursementSchema,
  loanIdSchema,
  loanIdsSchema,
  loanPaymentSchema,
  loanSchema,
} from "@/features/loans/schemas/loan-schemas";

const validLoan = {
  direction: "lent",
  personName: "Carlos",
  amount: "100",
  currency: "USD",
  interestRate: "2.5",
  loanedOn: "2026-01-15",
};

describe("loanSchema", () => {
  it("parses a valid loan and coerces numeric fields", () => {
    const parsed = loanSchema.parse(validLoan);

    expect(parsed).toEqual({
      direction: "lent",
      personName: "Carlos",
      amount: 100,
      currency: "USD",
      interestRate: 2.5,
      loanedOn: "2026-01-15",
    });
  });

  it("trims names and accepts optional fields", () => {
    const parsed = loanSchema.parse({
      ...validLoan,
      personName: "  Carlos  ",
      description: "  para el viaje  ",
      expectedOn: "2026-02-01",
      notes: "  sin interes  ",
    });

    expect(parsed.personName).toBe("Carlos");
    expect(parsed.description).toBe("para el viaje");
    expect(parsed.expectedOn).toBe("2026-02-01");
    expect(parsed.notes).toBe("sin interes");
  });

  it("rejects an empty person name", () => {
    const result = loanSchema.safeParse({ ...validLoan, personName: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el nombre de la persona.",
      );
    }
  });

  it("rejects a person name shorter than 2 characters", () => {
    const result = loanSchema.safeParse({ ...validLoan, personName: "C" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el nombre de la persona.",
      );
    }
  });

  it("rejects a zero amount", () => {
    const result = loanSchema.safeParse({ ...validLoan, amount: "0" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto debe ser mayor a 0.",
      );
    }
  });

  it("rejects a negative amount", () => {
    const result = loanSchema.safeParse({ ...validLoan, amount: "-50" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto debe ser mayor a 0.",
      );
    }
  });

  it("rejects a non numeric amount", () => {
    const result = loanSchema.safeParse({ ...validLoan, amount: "cien" });

    expect(result.success).toBe(false);
  });

  it("rejects a negative interest rate", () => {
    const result = loanSchema.safeParse({ ...validLoan, interestRate: "-1" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El interés no puede ser negativo.",
      );
    }
  });

  it("rejects blank interest rates and boolean amounts", () => {
    expect(
      loanSchema.safeParse({ ...validLoan, interestRate: "" }).success,
    ).toBe(false);
    expect(loanSchema.safeParse({ ...validLoan, amount: true }).success).toBe(
      false,
    );
  });

  it("rejects an interest rate above 100", () => {
    const result = loanSchema.safeParse({ ...validLoan, interestRate: "101" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El interés mensual no puede superar 100%.",
      );
    }
  });

  it("rejects an unsupported currency", () => {
    const result = loanSchema.safeParse({ ...validLoan, currency: "EUR" });

    expect(result.success).toBe(false);
  });

  it("rejects an unknown direction", () => {
    const result = loanSchema.safeParse({ ...validLoan, direction: "given" });

    expect(result.success).toBe(false);
  });

  it("rejects an empty loanedOn date", () => {
    const result = loanSchema.safeParse({ ...validLoan, loanedOn: "" });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona la fecha del préstamo.",
      );
    }
  });
});

describe("addLoanSchema", () => {
  it("accepts the disbursement subset without person or direction", () => {
    const parsed = addLoanSchema.parse({
      amount: "250",
      currency: "PEN",
      interestRate: "0",
      loanedOn: "2026-01-20",
    });

    expect(parsed.amount).toBe(250);
    expect(parsed.interestRate).toBe(0);
  });

  it("rejects a missing currency", () => {
    const result = addLoanSchema.safeParse({
      amount: "250",
      interestRate: "0",
      loanedOn: "2026-01-20",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid amount", () => {
    const result = addLoanSchema.safeParse({
      amount: "abc",
      currency: "PEN",
      interestRate: "0",
      loanedOn: "2026-01-20",
    });

    expect(result.success).toBe(false);
  });
});

describe("editLoanPersonSchema", () => {
  it("accepts a valid person edit", () => {
    expect(
      editLoanPersonSchema.parse({
        personName: "  Carlos  ",
        expectedOn: "2026-03-01",
        notes: "  ok  ",
      }),
    ).toEqual({
      personName: "Carlos",
      expectedOn: "2026-03-01",
      notes: "ok",
    });
  });

  it("rejects a missing person name", () => {
    expect(editLoanPersonSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a short person name", () => {
    expect(editLoanPersonSchema.safeParse({ personName: "C" }).success).toBe(
      false,
    );
  });
});

describe("loanPaymentSchema", () => {
  it("parses a valid payment", () => {
    expect(
      loanPaymentSchema.parse({
        amount: "75.5",
        occurredOn: "2026-02-10",
        notes: "  abono  ",
      }),
    ).toEqual({
      amount: 75.5,
      occurredOn: "2026-02-10",
      notes: "abono",
    });
  });

  it("rejects a zero amount", () => {
    const result = loanPaymentSchema.safeParse({
      amount: "0",
      occurredOn: "2026-02-10",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto debe ser mayor a 0.",
      );
    }
  });

  it("rejects an empty date", () => {
    const result = loanPaymentSchema.safeParse({
      amount: "10",
      occurredOn: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona la fecha del pago.",
      );
    }
  });

  it("rejects a missing amount", () => {
    expect(
      loanPaymentSchema.safeParse({ occurredOn: "2026-02-10" }).success,
    ).toBe(false);
  });
});

describe("loanDisbursementSchema", () => {
  it("parses a valid disbursement", () => {
    const parsed = loanDisbursementSchema.parse({
      amount: "300",
      occurredOn: "2026-02-15",
      interestRate: "3",
      description: "  segundo desembolso  ",
    });

    expect(parsed).toEqual({
      amount: 300,
      occurredOn: "2026-02-15",
      interestRate: 3,
      description: "segundo desembolso",
    });
  });

  it("rejects a missing interest rate", () => {
    const result = loanDisbursementSchema.safeParse({
      amount: "300",
      occurredOn: "2026-02-15",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an interest rate above 100", () => {
    const result = loanDisbursementSchema.safeParse({
      amount: "300",
      occurredOn: "2026-02-15",
      interestRate: "150",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El interés mensual no puede superar 100%.",
      );
    }
  });

  it("rejects a negative amount", () => {
    const result = loanDisbursementSchema.safeParse({
      amount: "-1",
      occurredOn: "2026-02-15",
      interestRate: "3",
    });

    expect(result.success).toBe(false);
  });
});

describe("loan id schemas", () => {
  const id = "3f2504e0-4f89-41d3-9a0c-0305e82c3301";

  it("accepts a valid uuid", () => {
    expect(loanIdSchema.parse(id)).toBe(id);
  });

  it("rejects an invalid uuid", () => {
    const result = loanIdSchema.safeParse("loan-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona un préstamo válido.",
      );
    }
  });

  it("accepts a list of valid uuids", () => {
    expect(loanIdsSchema.parse([id])).toEqual([id]);
  });

  it("rejects a list with an invalid uuid", () => {
    expect(loanIdsSchema.safeParse([id, "nope"]).success).toBe(false);
  });

  it("rejects a non array value", () => {
    expect(loanIdsSchema.safeParse(id).success).toBe(false);
  });
});
