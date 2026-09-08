"use client"

import { useQuery } from "@tanstack/react-query"
import { getLoans } from "@/lib/finance/loans/lib/loans-api"

export function useLoans() {
  return useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
  })
}
