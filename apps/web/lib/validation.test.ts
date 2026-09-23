import { describe, expect, it } from "vitest";
import { z } from "zod";

import { parseOrThrow } from "@/lib/validation";

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
