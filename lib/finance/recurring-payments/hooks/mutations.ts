"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createRecurringPayment,
  updateRecurringPayment,
  deleteRecurringPayment,
  setRecurringPaymentActive,
  registerRecurringPaymentPayment,
} from "@/features/recurring-payments/lib/recurring-payments-api"
import { type RecurringPaymentValues, type RecurringPaymentPaymentValues } from "@/features/recurring-payments/schemas/recurring-payment-schemas"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"

export function useCreateRecurringPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createRecurringPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recurring-payments"] })
      toast.success("Pago recurrente creado")
    },
    onError: (error) => {
      toast.error("No se pudo crear el pago recurrente", { description: error.message })
    },
  })
}

export function useUpdateRecurringPayment(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RecurringPaymentValues) => updateRecurringPayment(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recurring-payments"] })
      toast.success("Pago recurrente actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el pago recurrente", { description: error.message })
    },
  })
}

export function useDeleteRecurringPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteRecurringPayment,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["recurring-payments"] })
      toast.success("Pago recurrente eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar el pago recurrente", { description: error.message })
    },
  })
}

export function useSetRecurringPaymentActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => setRecurringPaymentActive(id, active),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["recurring-payments"] })
      toast.success(variables.active ? "Pago recurrente activado" : "Pago recurrente pausado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el estado", { description: error.message })
    },
  })
}

export function useRegisterRecurringPaymentPayment(payment: RecurringPayment | null) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: RecurringPaymentPaymentValues) => registerRecurringPaymentPayment(payment!, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["recurring-payments"] }),
        queryClient.invalidateQueries({ queryKey: ["recurring-payment-history"] }),
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
