import { z } from "zod"

import { LOAN_CURRENCIES } from "@/features/loans/types/loan-types"

export const loanSchema = z.object({
  direction: z.enum(["lent", "borrowed"]),
  personName: z.string().trim().min(2, "Ingresa el nombre de la persona."),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  currency: z.enum(LOAN_CURRENCIES),
  expectedOn: z.string().optional(),
  loanedOn: z.string().min(1, "Selecciona la fecha del préstamo."),
  notes: z.string().trim().optional(),
})

export type LoanValues = z.infer<typeof loanSchema>

export const editLoanPersonSchema = z.object({
  personName: z.string().trim().min(2, "Ingresa el nombre de la persona."),
  expectedOn: z.string().optional(),
  notes: z.string().trim().optional(),
})

export type EditLoanPersonValues = z.infer<typeof editLoanPersonSchema>

export const loanPaymentSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  occurredOn: z.string().min(1, "Selecciona la fecha del pago."),
  notes: z.string().trim().optional(),
})

export type LoanPaymentValues = z.infer<typeof loanPaymentSchema>
