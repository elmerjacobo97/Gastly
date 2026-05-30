"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createLoan, updateLoan, deleteLoan, recordLoanPayment } from "@/features/loans/lib/loans-api"
import { type LoanValues, type LoanPaymentValues } from "@/features/loans/schemas/loan-schemas"

export function useCreateLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createLoan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] })
      toast.success("Préstamo registrado")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el préstamo", { description: error.message })
    },
  })
}

export function useUpdateLoan(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: LoanValues) => updateLoan(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] })
      toast.success("Préstamo actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el préstamo", { description: error.message })
    },
  })
}

export function useDeleteLoan() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteLoan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] })
      toast.success("Préstamo eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar el préstamo", { description: error.message })
    },
  })
}

export function useRecordLoanPayment(loanId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: LoanPaymentValues) => recordLoanPayment(loanId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] })
      toast.success("Abono registrado")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el abono", { description: error.message })
    },
  })
}
