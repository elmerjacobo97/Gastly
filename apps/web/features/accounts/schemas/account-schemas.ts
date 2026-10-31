import { z } from "zod";

import { CURRENCY_CODES } from "@/lib/format";
import { numberInput } from "@/lib/validation";

export const ACCOUNT_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#14b8a6",
  "#64748b",
] as const;

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de la cuenta."),
  currency: z.enum(CURRENCY_CODES),
  balance: numberInput(
    z
      .number({ error: "Ingresa un saldo válido." })
      .min(0, "El saldo no puede ser negativo."),
  ),
  color: z.string(),
  notes: z.string().trim().optional(),
});

export type AccountValues = z.infer<typeof accountSchema>;

export const accountUpdateSchema = accountSchema
  .pick({ name: true, color: true, notes: true })
  .extend({
    balance: numberInput(z.number({ error: "Ingresa un saldo válido." })),
  });

export type AccountUpdateValues = z.infer<typeof accountUpdateSchema>;

export const accountIdSchema = z.string().uuid("Selecciona una cuenta válida.");
