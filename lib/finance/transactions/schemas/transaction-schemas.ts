import { z } from "zod"

export const transactionTypes = ["expense", "income"] as const
export const paymentMethods = ["cash", "credit_card"] as const

export const transactionSchema = z.object({
  type: z.enum(transactionTypes),
  amount: z.coerce.number().positive("Ingresa un monto mayor a 0."),
  description: z.string().trim().min(2, "Describe la transacción."),
  categoryName: z.string().trim().min(2, "Ingresa una categoria."),
  occurredOn: z.string().min(1, "Selecciona una fecha."),
  notes: z.string().trim().optional(),
  paymentMethod: z.enum(paymentMethods),
  creditCardName: z.string().trim().optional(),
  creditCardDueOn: z.string().optional(),
})

export type TransactionType = (typeof transactionTypes)[number]
export type PaymentMethod = (typeof paymentMethods)[number]
export type TransactionValues = z.infer<typeof transactionSchema>
