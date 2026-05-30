"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createFixedExpense,
  updateFixedExpense,
  deleteFixedExpense,
  setFixedExpenseActive,
  registerFixedExpensePayment,
} from "@/features/fixed-expenses/lib/fixed-expenses-api"
import { type FixedExpenseValues, type FixedExpensePaymentValues } from "@/features/fixed-expenses/schemas/fixed-expense-schemas"
import { type FixedExpense } from "@/features/fixed-expenses/types/fixed-expense-types"

export function useCreateFixedExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFixedExpense,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] })
      toast.success("Gasto fijo creado")
    },
    onError: (error) => {
      toast.error("No se pudo crear el gasto fijo", { description: error.message })
    },
  })
}

export function useUpdateFixedExpense(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: FixedExpenseValues) => updateFixedExpense(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] })
      toast.success("Gasto fijo actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el gasto fijo", { description: error.message })
    },
  })
}

export function useDeleteFixedExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteFixedExpense,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] })
      toast.success("Gasto fijo eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar el gasto fijo", { description: error.message })
    },
  })
}

export function useSetFixedExpenseActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setFixedExpenseActive(id, active),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] })
      toast.success(variables.active ? "Gasto fijo activado" : "Gasto fijo pausado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el estado", { description: error.message })
    },
  })
}

export function useRegisterFixedExpensePayment(expense: FixedExpense | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: FixedExpensePaymentValues) => registerFixedExpensePayment(expense!, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["fixed-expense-history"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        queryClient.invalidateQueries({ queryKey: ["accounts"] }),
      ])
      toast.success("Pago registrado como transacción")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el pago", { description: error.message })
    },
  })
}
