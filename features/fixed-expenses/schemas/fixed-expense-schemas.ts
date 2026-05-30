import { z } from "zod/v3"

export const fixedExpenseSchema = z.object({
  description: z.string().trim().min(2, "Ingresa un nombre."),
  amount: z.coerce.number().positive("El monto estimado debe ser mayor a 0."),
  categoryId: z.string().min(1, "Selecciona una categoria."),
  frequency: z.enum(["monthly", "custom_months", "yearly"]),
  intervalMonths: z.coerce
    .number()
    .int("El intervalo debe ser un numero entero.")
    .min(1, "El intervalo debe ser al menos 1 mes.")
    .max(120, "El intervalo no puede ser mayor a 120 meses."),
  paymentKind: z.enum(["fixed", "variable"]),
  nextDueOn: z.string().min(1, "Selecciona la proxima fecha de pago."),
  accountId: z.string().optional(),
  notes: z.string().trim().optional(),
})

export const fixedExpensePaymentSchema = z.object({
  amount: z.coerce.number().positive("El monto real debe ser mayor a 0."),
  occurredOn: z.string().min(1, "Selecciona la fecha de pago."),
  notes: z.string().trim().optional(),
})

export type FixedExpenseValues = z.infer<typeof fixedExpenseSchema>
export type FixedExpensePaymentValues = z.infer<typeof fixedExpensePaymentSchema>
