"use client"

import { useQuery } from "@tanstack/react-query"
import { getCategories } from "@/features/categories/lib/categories-api"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

export function useCategories(type?: TransactionType, enabled = true) {
  return useQuery({
    queryKey: ["categories", type],
    queryFn: () => getCategories(type),
    enabled,
  })
}
