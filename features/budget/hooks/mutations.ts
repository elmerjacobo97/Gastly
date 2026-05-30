"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createBudget, updateBudget, deleteBudget } from "@/features/budget/lib/budget-api"
import { type BudgetValues } from "@/features/budget/schemas/budget-schemas"

export function useCreateBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Presupuesto guardado")
    },
    onError: (error) => {
      toast.error("No se pudo guardar el presupuesto", { description: error.message })
    },
  })
}

export function useUpdateBudget(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (amount: number) => updateBudget(id, amount),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Presupuesto actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el presupuesto", { description: error.message })
    },
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Presupuesto eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar el presupuesto", { description: error.message })
    },
  })
}
