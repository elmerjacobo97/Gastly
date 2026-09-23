import { z } from "zod";

export const recurringPaymentSchema = z.object({
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
  type: z.enum(["expense", "income"]),
});

export const recurringPaymentPaymentSchema = z.object({
  amount: z.coerce.number().positive("El monto real debe ser mayor a 0."),
  occurredOn: z.string().min(1, "Selecciona la fecha de pago."),
  notes: z.string().trim().optional(),
});

export type RecurringPaymentValues = z.infer<typeof recurringPaymentSchema>;
export type RecurringPaymentPaymentValues = z.infer<
  typeof recurringPaymentPaymentSchema
>;

export const recurringPaymentIdSchema = z
  .string()
  .uuid("Selecciona un pago recurrente válido.");

export const recurringPaymentActiveSchema = z.boolean(
  "Selecciona un estado válido.",
);

export const recurringPaymentRefSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(["expense", "income"]),
  description: z.string().min(1),
  frequency: z.enum(["monthly", "custom_months", "yearly"]),
  intervalMonths: z.coerce.number().int().positive(),
  nextDueOn: z.string().min(1),
  notes: z.string().nullable(),
  category: z.object({ id: z.string().uuid() }).nullable(),
  accountId: z.string().uuid().nullable(),
});
