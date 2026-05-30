"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { createCategory, updateCategory, deleteCategory } from "@/features/categories/lib/categories-api"
import { type CategoryValues } from "@/features/categories/schemas/category-schemas"

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
      ])
      toast.success("Categoría creada")
    },
    onError: (error) => {
      toast.error("No se pudo crear la categoría", { description: error.message })
    },
  })
}

export function useUpdateCategory(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: CategoryValues) => updateCategory(id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] }),
        queryClient.invalidateQueries({ queryKey: ["budgets"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
      ])
      toast.success("Categoría actualizada")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar la categoría", { description: error.message })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      ])
      toast.success("Categoría eliminada")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar la categoría", { description: error.message })
    },
  })
}
