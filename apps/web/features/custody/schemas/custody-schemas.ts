import { z } from "zod";

import { numberInput, optionalNumberInput } from "@/lib/validation";

export const custodyOrderSchema = z.object({
  personName: z.string().trim().min(2, "Ingresa el nombre de la persona."),
  title: z.string().trim().min(2, "Ingresa el propósito del encargo."),
  targetAmount: optionalNumberInput(
    z.number({ error: "Ingresa un monto válido." }).nonnegative(),
  ),
  expectedOn: z.string().optional(),
  notes: z.string().trim().optional(),
});

export type CustodyOrderValues = z.infer<typeof custodyOrderSchema>;

export const custodyMovementSchema = z.object({
  type: z.enum(["deposit", "disbursement"]),
  amount: numberInput(
    z
      .number({ error: "Ingresa un monto válido." })
      .positive("El monto debe ser mayor a 0."),
  ),
  occurredOn: z.string().min(1, "Selecciona la fecha."),
  method: z.enum(["yape", "plin", "transfer", "cash"]).optional(),
  notes: z.string().trim().optional(),
});

export type CustodyMovementValues = z.infer<typeof custodyMovementSchema>;

export const custodyOrderIdSchema = z
  .string()
  .uuid("Selecciona un encargo válido.");

export const custodyMovementIdSchema = z
  .string()
  .uuid("Selecciona un movimiento válido.");

export const custodyOrderStatusSchema = z.enum(
  ["active", "completed", "cancelled"],
  "Selecciona un estado válido.",
);
