import { z } from "zod";

import { CURRENCY_CODES } from "@/lib/format";
import { transactionTypes } from "@/lib/transaction-types";
import { numberInput, optionalNumberInput } from "@/lib/validation";

export const transactionSchema = z.object({
  type: z.enum(transactionTypes),
  amount: numberInput(
    z
      .number({ error: "Ingresa un monto válido." })
      .positive("Ingresa un monto mayor a 0."),
  ),
  currency: z.enum(CURRENCY_CODES).default("PEN"),
  description: z.string().trim().min(2, "Describe la transacción."),
  categoryName: z.string().trim().min(2, "Ingresa una categoria."),
  occurredOn: z.string().min(1, "Selecciona una fecha."),
  notes: z.string().trim().optional(),
  accountId: z
    .union([z.string().uuid("Selecciona una cuenta válida."), z.literal("")])
    .optional(),
  accountAmount: optionalNumberInput(
    z.number().positive("El monto en la cuenta debe ser mayor a 0."),
  ),
});

export type TransactionValues = z.infer<typeof transactionSchema>;

export const transactionIdSchema = z
  .string()
  .uuid("Selecciona una transacción válida.");
