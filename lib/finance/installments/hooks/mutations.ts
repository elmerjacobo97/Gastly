"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createInstallmentPurchase,
  updateInstallmentPurchase,
  deleteInstallmentPurchase,
  payMonthInstallments,
} from "@/lib/finance/installments/lib/installments-api"
import { type InstallmentPurchaseValues, type PayInstallmentsValues } from "@/lib/finance/installments/schemas/installment-schemas"
import { type InstallmentPayment, type InstallmentPurchase } from "@/lib/finance/installments/types/installment-types"

function invalidateInstallmentQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["installments"] }),
    queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
    queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
    queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["accounts"] }),
  ])
}

export function useCreateInstallmentPurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createInstallmentPurchase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["installments"] })
      toast.success("Compra en cuotas registrada")
    },
    onError: (error) => {
      toast.error("No se pudo registrar", { description: error.message })
    },
  })
}

export function useUpdateInstallmentPurchase(id: string, paidCount: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: InstallmentPurchaseValues) =>
      updateInstallmentPurchase(id, values, paidCount),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["installments"] })
      toast.success("Compra actualizada")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar", { description: error.message })
    },
  })
}

export function useDeleteInstallmentPurchase() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteInstallmentPurchase,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["installments"] })
      toast.success("Compra eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar", { description: error.message })
    },
  })
}

export function usePayMonthInstallments(
  pending: Array<{ payment: InstallmentPayment; purchase: InstallmentPurchase }>
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ occurredOn }: PayInstallmentsValues) =>
      payMonthInstallments(pending, occurredOn),
    onSuccess: async () => {
      await invalidateInstallmentQueries(queryClient)
      toast.success(
        `${pending.length} cuota${pending.length !== 1 ? "s" : ""} registrada${pending.length !== 1 ? "s" : ""} como gasto`
      )
    },
    onError: (error) => {
      toast.error("No se pudo registrar el pago", { description: error.message })
    },
  })
}

export function usePaySingleInstallment(
  payment: InstallmentPayment,
  purchase: InstallmentPurchase
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ occurredOn }: PayInstallmentsValues) =>
      payMonthInstallments([{ payment, purchase }], occurredOn),
    onSuccess: async () => {
      await invalidateInstallmentQueries(queryClient)
      toast.success("Cuota registrada como gasto")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el pago", { description: error.message })
    },
  })
}
