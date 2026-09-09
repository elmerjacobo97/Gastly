"use client"

import { CalendarClockIcon } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { CreateRecurringPaymentDialog } from "@/features/recurring-payments/components/create-recurring-payment-dialog"
import { type Account } from "@/features/accounts/types/account-types"
import { type Category } from "@/features/categories/types/category-types"

type RecurringPaymentsEmptyStateProps = {
  accounts: Account[]
  categories: Category[]
}

export function RecurringPaymentsEmptyState({ accounts, categories }: RecurringPaymentsEmptyStateProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Empty className="border bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CalendarClockIcon />
            </EmptyMedia>
            <EmptyTitle>Sin pagos recurrentes aún</EmptyTitle>
            <EmptyDescription>
              Crea tus pagos recurrentes para saber cuánto tienes estimado y qué falta pagar.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateRecurringPaymentDialog accounts={accounts} categories={categories} />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  )
}
