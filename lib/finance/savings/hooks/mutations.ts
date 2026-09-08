"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addContribution } from "@/features/savings/lib/savings-api"
import { type SavingsGoalValues, type ContributionValues } from "@/features/savings/schemas/savings-schemas"
import { type SavingsGoal } from "@/features/savings/types/savings-types"

export function useCreateSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createSavingsGoal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      toast.success("Meta de ahorro creada")
    },
    onError: (error) => {
      toast.error("No se pudo crear la meta", { description: error.message })
    },
  })
}

export function useUpdateSavingsGoal(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SavingsGoalValues) => updateSavingsGoal(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      toast.success("Meta actualizada")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar la meta", { description: error.message })
    },
  })
}

export function useDeleteSavingsGoal() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteSavingsGoal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      toast.success("Meta eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar la meta", { description: error.message })
    },
  })
}

export function useAddContribution(goal: SavingsGoal) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: ContributionValues) => addContribution(goal, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      toast.success("Aporte registrado")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el aporte", { description: error.message })
    },
  })
}
