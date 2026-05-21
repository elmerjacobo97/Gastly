import { z } from "zod/v3"

export const transactionTypes = ["expense", "income"] as const

export const transactionSchema = z.object({
  type: z.enum(transactionTypes),
  amount: z.coerce.number().positive("Ingresa un monto mayor a 0."),
  description: z.string().trim().min(2, "Describe la transacción."),
  categoryName: z.string().trim().min(2, "Ingresa una categoria."),
  occurredOn: z.string().min(1, "Selecciona una fecha."),
  notes: z.string().trim().optional(),
})

export type TransactionType = (typeof transactionTypes)[number]
export type TransactionValues = z.infer<typeof transactionSchema>
