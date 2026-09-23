import { z } from "zod";

import { paymentMethods, transactionTypes } from "@/lib/transaction-types";
import { numberInput } from "@/lib/validation";

export const transactionSchema = z.object({
  type: z.enum(transactionTypes),
  amount: numberInput(
    z
      .number({ error: "Ingresa un monto válido." })
      .positive("Ingresa un monto mayor a 0."),
  ),
  description: z.string().trim().min(2, "Describe la transacción."),
  categoryName: z.string().trim().min(2, "Ingresa una categoria."),
  occurredOn: z.string().min(1, "Selecciona una fecha."),
  notes: z.string().trim().optional(),
  paymentMethod: z.enum(paymentMethods),
  creditCardName: z.string().trim().optional(),
  creditCardDueOn: z.string().optional(),
});

export type TransactionValues = z.infer<typeof transactionSchema>;

export const transactionIdSchema = z
  .string()
  .uuid("Selecciona una transacción válida.");

export const creditCardNameSchema = z
  .string()
  .trim()
  .min(1, "Selecciona una tarjeta válida.")
  .nullable();
