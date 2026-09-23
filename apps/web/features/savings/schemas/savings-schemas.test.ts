import { describe, expect, it } from "vitest";

import {
  contributionSchema,
  savingsGoalIdSchema,
  savingsGoalSchema,
} from "@/features/savings/schemas/savings-schemas";

describe("savingsGoalSchema", () => {
  it("parses a valid goal and coerces the target amount", () => {
    const parsed = savingsGoalSchema.parse({
      name: "Viaje",
      targetAmount: "5000",
      targetDate: "2026-12-31",
      color: "#1d42d0",
    });

    expect(parsed).toEqual({
      name: "Viaje",
      targetAmount: 5000,
      targetDate: "2026-12-31",
      color: "#1d42d0",
    });
  });

  it("accepts a goal without a target date", () => {
    expect(
      savingsGoalSchema.parse({
        name: "Viaje",
        targetAmount: 5000,
        color: "#1d42d0",
      }).targetDate,
    ).toBeUndefined();
  });

  it("trims the name and notes", () => {
    const parsed = savingsGoalSchema.parse({
      name: "  Viaje  ",
      targetAmount: "100",
      color: "#1d42d0",
      notes: "  ahorro mensual  ",
    });

    expect(parsed.name).toBe("Viaje");
    expect(parsed.notes).toBe("ahorro mensual");
  });

  it("rejects an empty name", () => {
    const result = savingsGoalSchema.safeParse({
      name: "",
      targetAmount: "100",
      color: "#1d42d0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el nombre de la meta.",
      );
    }
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = savingsGoalSchema.safeParse({
      name: "V",
      targetAmount: "100",
      color: "#1d42d0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Ingresa el nombre de la meta.",
      );
    }
  });

  it("rejects a zero target amount", () => {
    const result = savingsGoalSchema.safeParse({
      name: "Viaje",
      targetAmount: "0",
      color: "#1d42d0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto objetivo debe ser mayor a 0.",
      );
    }
  });

  it("rejects a negative target amount", () => {
    const result = savingsGoalSchema.safeParse({
      name: "Viaje",
      targetAmount: "-100",
      color: "#1d42d0",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto objetivo debe ser mayor a 0.",
      );
    }
  });

  it("rejects a non numeric target amount", () => {
    const result = savingsGoalSchema.safeParse({
      name: "Viaje",
      targetAmount: "abc",
      color: "#1d42d0",
    });

    expect(result.success).toBe(false);
  });
});

describe("contributionSchema", () => {
  it("parses a valid contribution", () => {
    expect(
      contributionSchema.parse({
        amount: "150.5",
        occurredOn: "2026-04-01",
        notes: "  extra  ",
      }),
    ).toEqual({
      amount: 150.5,
      occurredOn: "2026-04-01",
      notes: "extra",
    });
  });

  it("rejects a zero amount", () => {
    const result = contributionSchema.safeParse({
      amount: "0",
      occurredOn: "2026-04-01",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto debe ser mayor a 0.",
      );
    }
  });

  it("rejects a negative amount", () => {
    const result = contributionSchema.safeParse({
      amount: "-20",
      occurredOn: "2026-04-01",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "El monto debe ser mayor a 0.",
      );
    }
  });

  it("rejects a non numeric amount", () => {
    const result = contributionSchema.safeParse({
      amount: "abc",
      occurredOn: "2026-04-01",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty date", () => {
    const result = contributionSchema.safeParse({
      amount: "10",
      occurredOn: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Selecciona una fecha.");
    }
  });

  it("rejects a missing amount", () => {
    expect(
      contributionSchema.safeParse({ occurredOn: "2026-04-01" }).success,
    ).toBe(false);
  });
});

describe("savingsGoalIdSchema", () => {
  it("accepts a valid uuid", () => {
    expect(
      savingsGoalIdSchema.parse("3f2504e0-4f89-41d3-9a0c-0305e82c3301"),
    ).toBe("3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  });

  it("rejects a non uuid string", () => {
    const result = savingsGoalIdSchema.safeParse("goal-1");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        "Selecciona una meta válida.",
      );
    }
  });
});
