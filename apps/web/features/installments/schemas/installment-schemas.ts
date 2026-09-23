import { z } from "zod";

export const installmentPurchaseSchema = z
  .object({
    description: z.string().trim().min(2, "Ingresa una descripción."),
    categoryId: z.string().min(1, "Selecciona una categoría."),
    totalAmount: z.coerce
      .number()
      .positive("El monto total debe ser mayor a 0."),
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
  });

export type InstallmentPurchaseValues = z.infer<
  typeof installmentPurchaseSchema
>;

export const payInstallmentsSchema = z.object({
  occurredOn: z.string().min(1, "Selecciona la fecha de pago."),
});

export type PayInstallmentsValues = z.infer<typeof payInstallmentsSchema>;

export const installmentPurchaseIdSchema = z
  .string()
  .uuid("Selecciona una compra válida.");

export const paidInstallmentsCountSchema = z.coerce
  .number()
  .int("Las cuotas pagadas deben ser un número entero.")
  .min(0, "Las cuotas pagadas no pueden ser negativas.");

export const pendingInstallmentsSchema = z.array(
  z.object({
    payment: z.object({
      id: z.string().uuid(),
      amount: z.coerce.number().positive(),
      paymentNumber: z.coerce.number().int().positive(),
    }),
    purchase: z.object({
      id: z.string().uuid(),
      description: z.string().min(1),
      totalInstallments: z.coerce.number().int().positive(),
      accountId: z.string().uuid().nullable(),
      category: z.object({ id: z.string().uuid() }).nullable(),
    }),
  }),
);
