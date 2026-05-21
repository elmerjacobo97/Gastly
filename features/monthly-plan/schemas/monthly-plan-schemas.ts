import { z } from "zod/v3"

export const monthlyPlanSchema = z
  .object({
    month: z.date(),
    expectedIncome: z.coerce.number().positive("El ingreso estimado debe ser mayor a 0."),
    savingsMode: z.enum(["percent", "amount"]),
    savingsValue: z.coerce.number().min(0, "El ahorro no puede ser negativo."),
    notes: z.string().trim().optional(),
  })
  .refine(
    (value) => value.savingsMode !== "percent" || value.savingsValue <= 100,
    {
      message: "El porcentaje no puede ser mayor a 100.",
      path: ["savingsValue"],
    }
  )

export type MonthlyPlanValues = z.infer<typeof monthlyPlanSchema>
