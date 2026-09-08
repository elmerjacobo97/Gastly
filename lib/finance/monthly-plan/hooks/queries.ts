"use client"

import { useQuery } from "@tanstack/react-query"
import { format, startOfMonth, subMonths } from "date-fns"
import { getMonthlyPlan } from "@/lib/finance/monthly-plan/lib/monthly-plan-api"

export function useMonthlyPlan(month: Date) {
  const monthKey = format(month, "yyyy-MM")
  return useQuery({
    queryKey: ["monthly-plan", monthKey],
    queryFn: () => getMonthlyPlan(month),
  })
}

export function usePrevMonthPlan(month: Date, enabled: boolean) {
  const prevMonth = subMonths(startOfMonth(month), 1)
  const monthKey = prevMonth.toISOString().slice(0, 7)
  return useQuery({
    queryKey: ["monthly-plan", monthKey],
    queryFn: () => getMonthlyPlan(prevMonth),
    enabled,
  })
}
