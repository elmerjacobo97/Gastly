"use client"

import { useQuery } from "@tanstack/react-query"
import { getCustodyOrders } from "@/lib/finance/custody/lib/custody-api"

export function useCustodyOrders() {
  return useQuery({
    queryKey: ["custody-orders"],
    queryFn: getCustodyOrders,
  })
}
