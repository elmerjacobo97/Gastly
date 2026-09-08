"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  payAllCreditCardTransactions,
} from "@/lib/finance/transactions/lib/transactions-api"
import { type TransactionValues } from "@/lib/finance/transactions/schemas/transaction-schemas"

function invalidateTransactionQueries(queryClient: ReturnType<typeof useQueryClient>) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ["transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
    queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
    queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
    queryClient.invalidateQueries({ queryKey: ["categories"] }),
    queryClient.invalidateQueries({ queryKey: ["budgets"] }),
    queryClient.invalidateQueries({ queryKey: ["unpaid-credit-card"] }),
  ])
}

export function useCreateTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient)
      toast.success("Transacción registrada")
    },
    onError: (error) => {
      toast.error("No se pudo registrar la transacción", { description: error.message })
    },
  })
}

export function useUpdateTransaction(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: TransactionValues) => updateTransaction(id, values),
    onSuccess: async () => {
      await invalidateTransactionQueries(queryClient)
      toast.success("Transacción actualizada")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar la transacción", { description: error.message })
    },
  })
}

export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        queryClient.invalidateQueries({ queryKey: ["unpaid-credit-card"] }),
      ])
      toast.success("Transacción eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar", { description: error.message })
    },
  })
}

export function usePayAllCreditCardTransactions() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: payAllCreditCardTransactions,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["unpaid-credit-card"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ])
      toast.success("Tarjeta pagada")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el pago", { description: error.message })
    },
  })
}
