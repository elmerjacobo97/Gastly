"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  createCustodyOrder,
  updateCustodyOrder,
  updateCustodyOrderStatus,
  deleteCustodyOrder,
  recordCustodyMovement,
  updateCustodyMovement,
  deleteCustodyMovement,
} from "@/lib/finance/custody/lib/custody-api"
import {
  type CustodyMovementValues,
  type CustodyOrderValues,
} from "@/lib/finance/custody/schemas/custody-schemas"
import { type CustodyOrderStatus } from "@/lib/finance/custody/types/custody-types"

export function useCreateCustodyOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustodyOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["custody-orders"] })
      toast.success("Encargo registrado")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el encargo", { description: error.message })
    },
  })
}

export function useUpdateCustodyOrder(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CustodyOrderValues) => updateCustodyOrder(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["custody-orders"] })
      toast.success("Encargo actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el encargo", { description: error.message })
    },
  })
}

export function useUpdateCustodyOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string
      status: CustodyOrderStatus
    }) => updateCustodyOrderStatus(id, status),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["custody-orders"] })
      toast.success("Estado del encargo actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el estado", { description: error.message })
    },
  })
}

export function useDeleteCustodyOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustodyOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["custody-orders"] })
      toast.success("Encargo eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar el encargo", { description: error.message })
    },
  })
}

export function useRecordCustodyMovement(custodyOrderId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CustodyMovementValues) =>
      recordCustodyMovement(custodyOrderId, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["custody-orders"] })
      toast.success("Movimiento registrado")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el movimiento", { description: error.message })
    },
  })
}

export function useUpdateCustodyMovement(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CustodyMovementValues) => updateCustodyMovement(id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["custody-orders"] })
      toast.success("Movimiento actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el movimiento", { description: error.message })
    },
  })
}

export function useDeleteCustodyMovement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCustodyMovement,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["custody-orders"] })
      toast.success("Movimiento eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar el movimiento", { description: error.message })
    },
  })
}
