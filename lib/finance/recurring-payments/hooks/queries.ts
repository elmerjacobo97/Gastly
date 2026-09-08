"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { getRecurringPayments, getRecurringPaymentHistory } from "@/lib/finance/recurring-payments/lib/recurring-payments-api"

export function useRecurringPayments(month: Date, type?: "expense" | "income") {
  const monthKey = format(month, "yyyy-MM")
  return useQuery({
    queryKey: ["recurring-payments", monthKey, type],
    queryFn: () => getRecurringPayments(month, type),
  })
}

export function useRecurringPaymentHistory(paymentId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["recurring-payment-history", paymentId],
    queryFn: () => getRecurringPaymentHistory(paymentId!),
    enabled: enabled && !!paymentId,
  })
}
