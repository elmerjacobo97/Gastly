"use client"

import { useQuery } from "@tanstack/react-query"
import { getLoans } from "@/features/loans/lib/loans-api"

export function useLoans() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
  })
}
