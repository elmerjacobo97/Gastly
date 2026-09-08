import { z } from "zod";

export const budgetSchema = z.object({
  categoryId: z.string().min(1, "Selecciona una categoria."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  month: z.date(),
});

export type BudgetValues = z.infer<typeof budgetSchema>;
