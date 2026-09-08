"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { getBudgets } from "@/features/budget/lib/budget-api"

export function useBudgets(month: Date) {
  const monthKey = format(month, "yyyy-MM")
  return useQuery({
    queryKey: ["budgets", monthKey],
    queryFn: () => getBudgets(month),
  })
}
