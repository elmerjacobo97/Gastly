import { z } from "zod/v3"

export const GOAL_COLORS = [
  "#1d42d0",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
] as const

export const savingsGoalSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre de la meta."),
  targetAmount: z.coerce.number().positive("El monto objetivo debe ser mayor a 0."),
  targetDate: z.string().optional(),
  color: z.string(),
  notes: z.string().trim().optional(),
})

export const contributionSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0."),
  occurredOn: z.string().min(1, "Selecciona una fecha."),
  notes: z.string().trim().optional(),
})

export type SavingsGoalValues = z.infer<typeof savingsGoalSchema>
export type ContributionValues = z.infer<typeof contributionSchema>
