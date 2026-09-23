import { z, type ZodType } from "zod";

function normalizeNumberInput(value: unknown) {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string" && value.trim() === "") return undefined;
  if (typeof value === "boolean") return Number.NaN;
  return value;
}

export function numberInput<T extends z.ZodNumber>(schema: T) {
  return z.preprocess(normalizeNumberInput, z.coerce.number()).pipe(schema);
}

export function optionalNumberInput<T extends z.ZodNumber>(schema: T) {
  return z
    .preprocess(normalizeNumberInput, z.coerce.number().optional())
    .pipe(schema.optional());
}

export function parseOrThrow<T>(schema: ZodType<T>, values: unknown): T {
  const parsed = schema.safeParse(values);
  if (parsed.success) return parsed.data;
  throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
}
