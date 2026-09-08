"use client"

import { useQuery } from "@tanstack/react-query"
import { getAccounts, getAccountTransfers } from "@/lib/finance/accounts/lib/accounts-api"

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  })
}

export function useAccountTransfers(enabled = true) {
  return useQuery({
    queryKey: ["account-transfers"],
    queryFn: () => getAccountTransfers(),
    enabled,
  })
}
