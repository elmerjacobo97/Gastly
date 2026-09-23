import { describe, expect, it } from "vitest";
import { z } from "zod";

import {
  numberInput,
  optionalNumberInput,
  parseOrThrow,
} from "@/lib/validation";

const personSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre."),
  age: z.coerce.number().min(0, "La edad no puede ser negativa."),
});

describe("parseOrThrow", () => {
  it("returns the parsed value for valid input", () => {
    expect(parseOrThrow(personSchema, { name: "  Ana  ", age: "30" })).toEqual({
      name: "Ana",
      age: 30,
    });
  });

  it("throws an Error with the first zod message for invalid input", () => {
    expect(() => parseOrThrow(personSchema, { name: "A", age: 5 })).toThrow(
      Error,
    );
    expect(() => parseOrThrow(personSchema, { name: "A", age: 5 })).toThrow(
      "Ingresa el nombre.",
    );
  });

  it("reports the first issue when multiple fields are invalid", () => {
    expect(() => parseOrThrow(personSchema, { name: "A", age: -1 })).toThrow(
      "Ingresa el nombre.",
    );
  });

  it("throws when the value is undefined", () => {
    expect(() => parseOrThrow(personSchema, undefined)).toThrow(Error);
  });

  it("throws when the value is null", () => {
    expect(() => parseOrThrow(personSchema, null)).toThrow(Error);
  });

  it("throws for a primitive schema when the value is undefined", () => {
    expect(() => parseOrThrow(z.string(), undefined)).toThrow(Error);
  });

  it("throws for a primitive schema when the value is null", () => {
    expect(() => parseOrThrow(z.string(), null)).toThrow(Error);
  });
});

describe("numberInput", () => {
  const schema = numberInput(
    z.number({ error: "Ingresa un monto válido." }).positive(),
  );

  it("coerces numeric strings and accepts numbers", () => {
    expect(schema.parse("12.5")).toBe(12.5);
    expect(schema.parse(12.5)).toBe(12.5);
  });

  it.each(["", "   ", null, true, false])(
    "rejects invalid numeric input %s",
    (value) => {
      expect(schema.safeParse(value).success).toBe(false);
    },
  );
});

describe("optionalNumberInput", () => {
  const schema = optionalNumberInput(z.number().nonnegative());

  it("treats blank or null input as omitted", () => {
    expect(schema.parse("")).toBeUndefined();
    expect(schema.parse("  ")).toBeUndefined();
    expect(schema.parse(null)).toBeUndefined();
  });

  it("rejects boolean input", () => {
    expect(schema.safeParse(true).success).toBe(false);
  });
});
