import { z } from "zod";

import { LOAN_CURRENCIES } from "@/features/loans/types/loan-types";
import { numberInput } from "@/lib/validation";

export const loanSchema = z.object({
  direction: z.enum(["lent", "borrowed"]),
  personName: z.string().trim().min(2, "Ingresa el nombre de la persona."),
  amount: numberInput(
    z
      .number({ error: "Ingresa un monto válido." })
      .positive("El monto debe ser mayor a 0."),
  ),
  currency: z.enum(LOAN_CURRENCIES),
  interestRate: numberInput(
    z
      .number({ error: "Ingresa un interés válido." })
      .min(0, "El interés no puede ser negativo.")
      .max(100, "El interés mensual no puede superar 100%."),
  ),
  description: z.string().trim().optional(),
  expectedOn: z.string().optional(),
  loanedOn: z.string().min(1, "Selecciona la fecha del préstamo."),
  notes: z.string().trim().optional(),
});

export type LoanValues = z.infer<typeof loanSchema>;

export const addLoanSchema = loanSchema.pick({
  amount: true,
  currency: true,
  interestRate: true,
  description: true,
  loanedOn: true,
  notes: true,
});

export type AddLoanValues = z.infer<typeof addLoanSchema>;

export const editLoanPersonSchema = z.object({
  personName: z.string().trim().min(2, "Ingresa el nombre de la persona."),
  expectedOn: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type EditLoanPersonValues = z.infer<typeof editLoanPersonSchema>;

export const loanPaymentSchema = z.object({
  amount: numberInput(
    z
      .number({ error: "Ingresa un monto válido." })
      .positive("El monto debe ser mayor a 0."),
  ),
  occurredOn: z.string().min(1, "Selecciona la fecha del pago."),
  notes: z.string().trim().optional(),
});

export type LoanPaymentValues = z.infer<typeof loanPaymentSchema>;

export const loanDisbursementSchema = loanPaymentSchema.extend({
  description: z.string().trim().optional(),
  interestRate: numberInput(
    z
      .number({ error: "Ingresa un interés válido." })
      .min(0, "El interés no puede ser negativo.")
      .max(100, "El interés mensual no puede superar 100%."),
  ),
});

export type LoanDisbursementValues = z.infer<typeof loanDisbursementSchema>;

export const loanIdSchema = z.string().uuid("Selecciona un préstamo válido.");

export const loanDisbursementIdSchema = z
  .string()
  .uuid("Selecciona un préstamo válido.");

export const loanPaymentIdSchema = z
  .string()
  .uuid("Selecciona una devolución válida.");

export const loanIdsSchema = z.array(
  z.string().uuid("Selecciona un préstamo válido."),
);
