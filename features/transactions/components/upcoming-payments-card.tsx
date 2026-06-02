import Link from "next/link"
import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { formatCurrency, formatDate } from "@/lib/format"

type UpcomingPayment = {
  expense: RecurringPayment
  days: number
}

type UpcomingPaymentsCardProps = {
  isLoading: boolean
  payments: UpcomingPayment[]
}

export function UpcomingPaymentsCard({ isLoading, payments }: UpcomingPaymentsCardProps) {
  if (isLoading || payments.length === 0) return null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <div>
          <CardTitle className="text-base">Próximos pagos</CardTitle>
          <CardDescription>Pagos recurrentes del mes ordenados por fecha</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground">
          <Link href="/dashboard/recurring-payments">
            Ver todos
            <ArrowRightIcon />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col divide-y">
          {payments.map(({ expense, days }) => {
            const isPaid = !!expense.paidOn
            const isOverdue = !isPaid && days < 0
            const isSoon = !isPaid && days >= 0 && days <= 3

            return (
              <div key={expense.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {expense.category && (
                  <CategoryIconBadge
                    icon={expense.category.icon}
                    color={expense.category.color}
                    className="size-8 shrink-0 rounded-lg"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {isPaid ? `Pagado el ${formatDate(expense.paidOn!)}` : formatDate(expense.nextDueOn)}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-medium tabular-nums">
                    {formatCurrency(expense.paidAmount ?? expense.amount)}
                  </span>
                  <Badge
                    variant={isOverdue ? "destructive" : "secondary"}
                    className={
                      isPaid
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : isSoon
                          ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                          : undefined
                    }
                  >
                    {isPaid
                      ? "Pagado"
                      : isOverdue
                        ? "Vencido"
                        : days === 0
                          ? "Hoy"
                          : days === 1
                            ? "Mañana"
                            : isSoon
                              ? `${days} días`
                              : "Pendiente"}
                  </Badge>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
