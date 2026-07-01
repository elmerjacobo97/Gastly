import { z } from "zod/v3"

export const custodyOrderSchema = z.object({
  personName: z.string().trim().min(2, "Ingresa el nombre de la persona."),
  title: z.string().trim().min(2, "Ingresa el propósito del encargo."),
  targetAmount: z.coerce.number().nonnegative().optional(),
  expectedOn: z.string().optional(),
  notes: z.string().trim().optional(),
})

export type CustodyOrderValues = z.infer<typeof custodyOrderSchema>

export const custodyMovementSchema = z.object({
  type: z.enum(["deposit", "disbursement"]),
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  occurredOn: z.string().min(1, "Selecciona la fecha."),
  method: z.enum(["yape", "plin", "transfer", "cash"]).optional(),
  notes: z.string().trim().optional(),
})

export type CustodyMovementValues = z.infer<typeof custodyMovementSchema>
