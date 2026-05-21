import { z } from "zod/v3"

export const loanSchema = z.object({
  direction: z.enum(["lent", "borrowed"]),
  personName: z.string().trim().min(2, "Ingresa el nombre de la persona."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  expectedOn: z.string().optional(),
  loanedOn: z.string().min(1, "Selecciona la fecha del préstamo."),
  notes: z.string().trim().optional(),
})

export type LoanValues = z.infer<typeof loanSchema>

export const loanPaymentSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  occurredOn: z.string().min(1, "Selecciona la fecha del pago."),
  notes: z.string().trim().optional(),
})

export type LoanPaymentValues = z.infer<typeof loanPaymentSchema>
