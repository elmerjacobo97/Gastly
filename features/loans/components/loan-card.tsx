"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CheckCircle2Icon,
  HistoryIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { AddLoanDialog } from "@/features/loans/components/add-loan-dialog"
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog"
import { earliestLoanedOn } from "@/features/loans/lib/group-loans"
import { type LoanPersonGroup } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

type LoanCardProps = {
  group: LoanPersonGroup
  settled: boolean
  onEdit: (group: LoanPersonGroup) => void
  onHistory: (group: LoanPersonGroup) => void
  onDelete: (group: LoanPersonGroup) => void
}

export function LoanCard({ group, settled, onEdit, onHistory, onDelete }: LoanCardProps) {
  const loanedOn = earliestLoanedOn(group)
  const pendingBalances = group.balances.filter((loan) => !loan.isSettled)

  return (
    <Card className={settled ? "opacity-60" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{group.personName}</CardTitle>
          <CardDescription>
            {settled
              ? group.direction === "lent"
                ? "Presté · "
                : "Me prestaron · "
              : group.direction === "lent"
                ? "Desde el "
                : "Recibido el "}
            {format(new Date(`${loanedOn}T12:00:00`), "d MMM yyyy", { locale: es })}
          </CardDescription>
          {!settled && group.balances.length > 1 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {group.balances.length} monedas
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
              <MoreHorizontalIcon />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(group)}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onHistory(group)}>
              <HistoryIcon />
              Historial
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(group)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {settled ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              {group.balances.map((loan) => (
                <div
                  key={loan.id}
                  className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400"
                >
                  <CheckCircle2Icon className="size-3.5" />
                  Saldado · {formatCurrency(loan.amount, loan.currency)}
                </div>
              ))}
            </div>
            <AddLoanDialog group={group} />
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {group.balances.map((loan) => {
              const pctPaid =
                loan.amount > 0
                  ? Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100))
                  : 0
              return (
                <div key={loan.id} className="flex flex-col gap-1.5">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(loan.amount, loan.currency)}
                  </p>
                  <Progress value={pctPaid} className="[&>div]:bg-primary" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                    <span>Abonado: {formatCurrency(loan.paidAmount, loan.currency)}</span>
                    <span className="font-medium text-destructive">
                      Pendiente: {formatCurrency(loan.pendingAmount, loan.currency)}
                    </span>
                  </div>
                </div>
              )
            })}
            {group.balances.some((loan) => loan.expectedOn) && (
              <div className="flex flex-wrap gap-1.5">
                {group.balances.flatMap((loan) =>
                  loan.expectedOn
                    ? [
                        <Badge key={loan.id} variant="secondary" className="text-xs font-normal">
                          {group.direction === "lent" ? "Devolución: " : "Pagar antes del "}
                          {format(new Date(`${loan.expectedOn}T12:00:00`), "d MMM yyyy", { locale: es })}
                          {group.balances.length > 1 ? ` · ${loan.currency}` : ""}
                        </Badge>,
                      ]
                    : []
                )}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <AddLoanDialog group={group} />
              {pendingBalances.length > 0 ? (
                <RecordPaymentDialog personName={group.personName} balances={pendingBalances} />
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
