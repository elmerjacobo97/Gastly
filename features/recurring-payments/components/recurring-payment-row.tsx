"use client"

import {
  CheckCircle2Icon,
  HistoryIcon,
  MoreHorizontalIcon,
  PauseCircleIcon,
  PencilIcon,
  PlayCircleIcon,
  ReceiptTextIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CategoryIconBadge } from "@/components/category-icon-badge"
import {
  formatFrequency,
  getPaymentBadge,
} from "@/features/recurring-payments/lib/recurring-payment-helpers"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { formatCurrency, formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

function payButtonLabel(payment: RecurringPayment) {
  const isPaid = !!payment.paidOn
  const isIncome = payment.type === "income"
  if (isPaid) return isIncome ? "Cobrado" : "Pagado"
  return isIncome ? "Cobrar" : "Pagar"
}

function RecurringPaymentSubtitle({ payment }: { payment: RecurringPayment }) {
  const isIncome = payment.type === "income"

  return (
    <p className="truncate text-xs text-muted-foreground">
      {payment.paidOn
        ? `${isIncome ? "Cobrado" : "Pagado"} el ${formatDate(payment.paidOn)}`
        : `${isIncome ? "Cobro" : "Vence"} el ${formatDate(payment.nextDueOn)}`}
      {payment.account && (
        <>
          {" · "}
          <span style={{ color: payment.account.color }}>{payment.account.name}</span>
        </>
      )}
      {" · "}{formatFrequency(payment)}
    </p>
  )
}

function RecurringPaymentMeta({ payment }: { payment: RecurringPayment }) {
  const isIncome = payment.type === "income"

  return (
    <div className="flex min-w-0 flex-1 items-center gap-3">
      {payment.category && (
        <CategoryIconBadge icon={payment.category.icon} color={payment.category.color} className="size-8 shrink-0 rounded-lg" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{payment.description}</p>
          {isIncome && (
            <span className="shrink-0 rounded bg-emerald-500/10 px-1 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
              Ingreso
            </span>
          )}
        </div>
        <RecurringPaymentSubtitle payment={payment} />
      </div>
    </div>
  )
}

function RecurringPaymentAmount({ payment }: { payment: RecurringPayment }) {
  const isIncome = payment.type === "income"
  return (
    <p className={cn("shrink-0 text-sm font-semibold tabular-nums", isIncome && "text-emerald-600 dark:text-emerald-400")}>
      {isIncome ? "+" : ""}{formatCurrency(payment.paidAmount ?? payment.amount)}
    </p>
  )
}

function RecurringPaymentPayButton({
  payment,
  pending,
  onPay,
}: {
  payment: RecurringPayment
  pending: boolean
  onPay: (payment: RecurringPayment) => void
}) {
  const isPaid = !!payment.paidOn
  return (
    <Button
      size="sm"
      disabled={!payment.isActive || isPaid || pending}
      onClick={() => onPay(payment)}
      variant={isPaid ? "secondary" : "default"}
      className="h-8 shrink-0"
    >
      {isPaid ? <CheckCircle2Icon className="size-3.5" /> : <ReceiptTextIcon className="size-3.5" />}
      {payButtonLabel(payment)}
    </Button>
  )
}

type RecurringPaymentRowProps = {
  payment: RecurringPayment
  monthKey: string
  pending: boolean
  onPay: (payment: RecurringPayment) => void
  onEdit: (payment: RecurringPayment) => void
  onHistory: (payment: RecurringPayment) => void
  onToggle: (payment: RecurringPayment) => void
  onDelete: (id: string) => void
}

export function RecurringPaymentRow({
  payment,
  monthKey,
  pending,
  onPay,
  onEdit,
  onHistory,
  onToggle,
  onDelete,
}: RecurringPaymentRowProps) {
  const badge = getPaymentBadge(payment, monthKey)

  return (
    <div className={cn("flex items-center gap-3 px-4 py-3.5", !payment.isActive && "opacity-60")}>
      <RecurringPaymentMeta payment={payment} />
      <RecurringPaymentAmount payment={payment} />
      <Badge variant={badge.variant} className={cn("hidden shrink-0 sm:inline-flex", badge.className)}>
        {badge.label}
      </Badge>
      <RecurringPaymentPayButton payment={payment} pending={pending} onPay={onPay} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
            <MoreHorizontalIcon />
            <span className="sr-only">Acciones</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => onEdit(payment)}>
            <PencilIcon />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onHistory(payment)}>
            <HistoryIcon />
            Historial de pagos
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onToggle(payment)}>
            {payment.isActive ? <PauseCircleIcon /> : <PlayCircleIcon />}
            {payment.isActive ? "Pausar" : "Activar"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => onDelete(payment.id)} className="text-destructive focus:text-destructive">
            <Trash2Icon />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
