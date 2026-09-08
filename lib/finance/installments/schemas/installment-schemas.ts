import { z } from "zod/v3"

export const installmentPurchaseSchema = z
  .object({
    description: z.string().trim().min(2, "Ingresa una descripción."),
    categoryId: z.string().min(1, "Selecciona una categoría."),
    totalAmount: z.coerce.number().positive("El monto total debe ser mayor a 0."),
    interestAmount: z.coerce.number().min(0),
    totalInstallments: z.coerce
      .number()
      .int("Debe ser un número entero.")
      .min(2, "Mínimo 2 cuotas.")
      .max(60, "Máximo 60 cuotas."),
    firstPaymentOn: z.string().min(1, "Selecciona la fecha del primer pago."),
    alreadyPaid: z.coerce.number().int().min(0),
    accountId: z.string().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((data) => data.alreadyPaid < data.totalInstallments, {
    message: "Las cuotas ya pagadas deben ser menos que el total.",
    path: ["alreadyPaid"],
  })

export type InstallmentPurchaseValues = z.infer<typeof installmentPurchaseSchema>

export const payInstallmentsSchema = z.object({
  occurredOn: z.string().min(1, "Selecciona la fecha de pago."),
})

export type PayInstallmentsValues = z.infer<typeof payInstallmentsSchema>
