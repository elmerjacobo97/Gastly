import { z } from "zod"

import { transactionTypes } from "@/lib/finance/transactions/schemas/transaction-schemas"

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Ingresa un nombre de categoria."),
  type: z.enum(transactionTypes),
  color: z.string().trim().min(1, "Selecciona un color."),
  icon: z.string().trim().min(1, "Selecciona un icono."),
})

export type CategoryValues = z.infer<typeof categorySchema>
