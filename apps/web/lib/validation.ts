import { type ZodType } from "zod";

export function parseOrThrow<T>(schema: ZodType<T>, values: unknown): T {
  const parsed = schema.safeParse(values);
  if (parsed.success) return parsed.data;
  throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
}
