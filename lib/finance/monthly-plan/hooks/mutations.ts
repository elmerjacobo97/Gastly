"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { upsertMonthlyPlan } from "@/lib/finance/monthly-plan/lib/monthly-plan-api"
import { type MonthlyPlanValues } from "@/lib/finance/monthly-plan/schemas/monthly-plan-schemas"

export function useUpsertMonthlyPlan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: MonthlyPlanValues) => upsertMonthlyPlan(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["monthly-plan"] })
      toast.success("Plan mensual guardado")
    },
    onError: (error) => {
      toast.error("No se pudo guardar el plan mensual", { description: error.message })
    },
  })
}
