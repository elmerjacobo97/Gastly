"use client"

import {
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  LOAN_CURRENCIES,
  LOAN_CURRENCY_LABELS,
} from "@/features/loans/types/loan-types"

export function LoanCurrencyOptions() {
  return (
    <>
      {LOAN_CURRENCIES.map((code) => (
        <NativeSelectOption key={code} value={code}>
          {LOAN_CURRENCY_LABELS[code]}
        </NativeSelectOption>
      ))}
    </>
  )
}
