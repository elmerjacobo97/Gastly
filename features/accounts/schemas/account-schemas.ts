import { z } from "zod/v3"

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
] as const

export const ACCOUNT_CURRENCIES = ["PEN", "USD", "MXN"] as const

export const accountSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de la cuenta."),
  currency: z.enum(ACCOUNT_CURRENCIES),
  balance: z.coerce.number().min(0, "El saldo no puede ser negativo."),
  isSavings: z.boolean(),
  color: z.string(),
  notes: z.string().trim().optional(),
})

export const transferSchema = z.object({
  fromAccountId: z.string().min(1, "Selecciona la cuenta de origen."),
  toAccountId: z.string().min(1, "Selecciona la cuenta de destino."),
  fromAmount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  toAmount: z.coerce.number().min(0),
  occurredOn: z.string().min(1, "Selecciona una fecha."),
  notes: z.string().trim().optional(),
}).refine((d) => d.fromAccountId !== d.toAccountId, {
  message: "Las cuentas deben ser distintas.",
  path: ["toAccountId"],
})

export type AccountValues = z.infer<typeof accountSchema>
export type TransferValues = z.infer<typeof transferSchema>
