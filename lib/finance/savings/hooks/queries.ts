"use client"

import { useQuery } from "@tanstack/react-query"
import { getSavingsGoals } from "@/lib/finance/savings/lib/savings-api"

export function useSavingsGoals() {
  return useQuery({
    queryKey: ["savings-goals"],
    queryFn: getSavingsGoals,
  })
}
