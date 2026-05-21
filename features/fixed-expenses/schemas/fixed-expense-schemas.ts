import { z } from "zod/v3"

export const fixedExpenseSchema = z.object({
  description: z.string().trim().min(2, "Ingresa un nombre."),
  amount: z.coerce.number().positive("El monto estimado debe ser mayor a 0."),
  categoryId: z.string().min(1, "Selecciona una categoria."),
  frequency: z.enum(["monthly", "yearly"]),
  paymentKind: z.enum(["fixed", "variable"]),
  nextDueOn: z.string().min(1, "Selecciona la proxima fecha de pago."),
  notes: z.string().trim().optional(),
})

export const fixedExpensePaymentSchema = z.object({
  amount: z.coerce.number().positive("El monto real debe ser mayor a 0."),
  occurredOn: z.string().min(1, "Selecciona la fecha de pago."),
  notes: z.string().trim().optional(),
})

export type FixedExpenseValues = z.infer<typeof fixedExpenseSchema>
export type FixedExpensePaymentValues = z.infer<typeof fixedExpensePaymentSchema>
