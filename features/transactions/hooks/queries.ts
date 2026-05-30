"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { getTransactions } from "@/features/transactions/lib/transactions-api"
import { getMonthlyTotals, getCategoryTotals } from "@/features/transactions/lib/charts-api"
import { getAllTransactions } from "@/features/transactions/lib/charts-api"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

export function useTransactions(opts?: { type?: TransactionType; month?: Date }) {
  const monthKey = opts?.month ? format(opts.month, "yyyy-MM") : ""
  const typeKey = opts?.type ?? "all"
  return useQuery({
    queryKey: ["transactions", typeKey, monthKey],
    queryFn: () => getTransactions(opts),
  })
}

export function useMonthlyTotals(months = 6) {
  return useQuery({
    queryKey: ["monthly-totals"],
    queryFn: () => getMonthlyTotals(months),
  })
}

export function useCategoryTotals(month: Date) {
  const monthKey = format(month, "yyyy-MM")
  return useQuery({
    queryKey: ["category-totals", monthKey],
    queryFn: () => getCategoryTotals(month),
  })
}

export function useAllTransactions(opts?: { from?: string; to?: string; type?: "expense" | "income" }) {
  return useQuery({
    queryKey: ["report-transactions", opts?.from, opts?.to],
    queryFn: () => getAllTransactions(opts),
  })
}
