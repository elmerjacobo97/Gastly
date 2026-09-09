"use client"

import { Card, CardContent } from "@/components/ui/card"
import { RecurringPaymentRow } from "@/features/recurring-payments/components/recurring-payment-row"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"

type RecurringPaymentListProps = {
  payments: RecurringPayment[]
  monthKey: string
  pending: boolean
  onPay: (payment: RecurringPayment) => void
  onEdit: (payment: RecurringPayment) => void
  onHistory: (payment: RecurringPayment) => void
  onToggle: (payment: RecurringPayment) => void
  onDelete: (id: string) => void
}

export function RecurringPaymentList({
  payments,
  monthKey,
  pending,
  onPay,
  onEdit,
  onHistory,
  onToggle,
  onDelete,
}: RecurringPaymentListProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col divide-y">
          {payments.map((payment) => (
            <RecurringPaymentRow
              key={payment.id}
              payment={payment}
              monthKey={monthKey}
              pending={pending}
              onPay={onPay}
              onEdit={onEdit}
              onHistory={onHistory}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
