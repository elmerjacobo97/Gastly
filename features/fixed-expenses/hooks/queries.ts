"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { getFixedExpenses, getFixedExpenseHistory } from "@/features/fixed-expenses/lib/fixed-expenses-api"

export function useFixedExpenses(month: Date) {
  const monthKey = format(month, "yyyy-MM")
  return useQuery({
    queryKey: ["fixed-expenses", monthKey],
    queryFn: () => getFixedExpenses(month),
  })
}

export function useFixedExpenseHistory(expenseId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["fixed-expense-history", expenseId],
    queryFn: () => getFixedExpenseHistory(expenseId!),
    enabled: enabled && !!expenseId,
  })
}
