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
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog"
import { type Loan } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

type LoanCardProps = {
  loan: Loan
  settled: boolean
  onEdit: (loan: Loan) => void
  onHistory: (loan: Loan) => void
  onDelete: (id: string) => void
}

export function LoanCard({ loan, settled, onEdit, onHistory, onDelete }: LoanCardProps) {
  const pctPaid = loan.amount > 0 ? Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100)) : 0

  return (
    <Card className={settled ? "opacity-60" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{loan.personName}</CardTitle>
          <CardDescription>
            {settled ? (loan.direction === "lent" ? "Presté · " : "Me prestaron · ") : loan.direction === "lent" ? "Prestado el " : "Recibido el "}
            {format(new Date(`${loan.loanedOn}T12:00:00`), "d MMM yyyy", { locale: es })}
          </CardDescription>
          {!settled && <p className="mt-1 text-sm font-semibold tabular-nums">{formatCurrency(loan.amount)}</p>}
          {!settled && loan.expectedOn && (
            <Badge variant="secondary" className="mt-1.5 text-xs font-normal">
              {loan.direction === "lent" ? "Devolución: " : "Pagar antes del "}
              {format(new Date(`${loan.expectedOn}T12:00:00`), "d MMM yyyy", { locale: es })}
            </Badge>
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
            <DropdownMenuItem onSelect={() => onEdit(loan)}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            {!settled && (
              <DropdownMenuItem onSelect={() => onHistory(loan)}>
                <HistoryIcon />
                Historial de abonos
              </DropdownMenuItem>
            )}
            {!settled && <DropdownMenuSeparator />}
            <DropdownMenuItem onSelect={() => onDelete(loan.id)} className="text-destructive focus:text-destructive">
              <Trash2Icon />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {settled ? (
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-3.5" />
            Saldado · {formatCurrency(loan.amount)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <Progress value={pctPaid} className="[&>div]:bg-primary" />
            <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
              <span>Abonado: {formatCurrency(loan.paidAmount)}</span>
              <span className="font-medium text-destructive">Pendiente: {formatCurrency(loan.pendingAmount)}</span>
            </div>
            {loan.notes && <p className="truncate text-xs text-muted-foreground">{loan.notes}</p>}
            <RecordPaymentDialog loan={loan} />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
