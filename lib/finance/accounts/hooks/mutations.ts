"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createAccount, updateAccount, deleteAccount, createTransfer } from "@/features/accounts/lib/accounts-api"
import { type AccountValues, type TransferValues } from "@/features/accounts/schemas/account-schemas"

export function useCreateAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Cuenta creada")
    },
    onError: (error) => {
      toast.error("No se pudo crear la cuenta", { description: error.message })
    },
  })
}

export function useUpdateAccount(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: AccountValues) => updateAccount(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Cuenta actualizada")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar la cuenta", { description: error.message })
    },
  })
}

export function useDeleteAccount() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
      toast.success("Cuenta eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar la cuenta", { description: error.message })
    },
  })
}

export function useCreateTransfer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createTransfer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
      await queryClient.invalidateQueries({ queryKey: ["account-transfers"] })
      toast.success("Transferencia registrada")
    },
    onError: (error) => {
      toast.error("No se pudo registrar la transferencia", { description: error.message })
    },
  })
}
