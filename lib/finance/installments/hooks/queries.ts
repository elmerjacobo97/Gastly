"use client"

import { useQuery } from "@tanstack/react-query"
import { getInstallmentPurchases } from "@/lib/finance/installments/lib/installments-api"

export function useInstallmentPurchases() {
  return useQuery({
    queryKey: ["installments"],
    queryFn: getInstallmentPurchases,
  })
}
