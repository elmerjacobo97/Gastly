import { z } from "zod";

import { CURRENCY_CODES } from "@/lib/format";
import { numberInput } from "@/lib/validation";

const monthSchema = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Selecciona un mes válido.");

const amountSchema = numberInput(
  z
    .number({ error: "Ingresa un monto válido." })
    .positive("Ingresa un monto mayor a 0."),
);

export const categoryBudgetSchema = z.object({
  categoryId: z.string().uuid("Selecciona una categoría válida."),
  month: monthSchema,
  currency: z.enum(CURRENCY_CODES),
  amount: amountSchema,
});

export type CategoryBudgetValues = z.infer<typeof categoryBudgetSchema>;

export const monthlyBudgetTotalSchema = z.object({
  month: monthSchema,
  currency: z.enum(CURRENCY_CODES),
  amount: amountSchema,
});

export type MonthlyBudgetTotalValues = z.infer<typeof monthlyBudgetTotalSchema>;

export const budgetIdSchema = z
  .string()
  .uuid("Selecciona un presupuesto válido.");
