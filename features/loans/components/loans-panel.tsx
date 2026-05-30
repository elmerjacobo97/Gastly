"use client"

import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  ArrowDownIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  HandCoinsIcon,
  HistoryIcon,
  MoreHorizontalIcon,
  PencilIcon,
  ScaleIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { EditLoanDialog } from "@/features/loans/components/edit-loan-dialog"
import { LoanDialog } from "@/features/loans/components/loan-dialog"
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog"
import { useLoans } from "@/features/loans/hooks/queries"
import { useDeleteLoan } from "@/features/loans/hooks/mutations"
import { type Loan } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

function LoanPaymentHistoryDialog({
  loan,
  open,
  onOpenChange,
}: {
  loan: Loan | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const payments = loan?.payments ?? []
  const total = payments.reduce((sum, p) => sum + p.amount, 0)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Historial de abonos</DialogTitle>
          <DialogDescription>
            {loan?.personName} · {payments.length} abono{payments.length !== 1 ? "s" : ""} registrado{payments.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        {payments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin abonos registrados aún.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <ScrollArea className="max-h-72">
              <div className="flex flex-col divide-y">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {format(new Date(`${p.occurredOn}T12:00:00`), "d MMM yyyy", { locale: es })}
                      </p>
                      {p.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground italic">{p.notes}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                      +{formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">Total abonado</span>
              <span className="font-semibold tabular-nums">{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export function LoansPanel() {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editLoan, setEditLoan] = useState<Loan | null>(null)
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null)

  const { data: loans = [], isLoading } = useLoans()
  const deleteMutation = useDeleteLoan()

  const active = loans.filter((l) => !l.isSettled)
  const settled = loans.filter((l) => l.isSettled)
  const activeLent = active.filter((l) => l.direction === "lent")
  const activeBorrowed = active.filter((l) => l.direction === "borrowed")
  const settledLent = settled.filter((l) => l.direction === "lent")
  const settledBorrowed = settled.filter((l) => l.direction === "borrowed")
  const totalToReceive = activeLent.reduce((s, l) => s + l.pendingAmount, 0)
  const totalToPay = activeBorrowed.reduce((s, l) => s + l.pendingAmount, 0)
  const netBalance = totalToReceive - totalToPay
  const isNetPositive = netBalance >= 0

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Préstamos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Préstamos y deudas con terceros. Registra abonos para hacer seguimiento.
          </p>
        </div>
        <LoanDialog />
      </section>

      {/* Summary cards */}
      {!isLoading && loans.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ArrowDownIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Me deben</p>
              <p className="truncate text-xs text-muted-foreground">{activeLent.length} préstamo{activeLent.length !== 1 ? "s" : ""} de cobro</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalToReceive)}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-destructive/10 text-destructive">
              <ArrowUpIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Debo</p>
              <p className="truncate text-xs text-muted-foreground">{activeBorrowed.length} deuda{activeBorrowed.length !== 1 ? "s" : ""} por pagar</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-destructive">
              {formatCurrency(totalToPay)}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${isNetPositive ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
              <ScaleIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Balance neto</p>
              <p className="truncate text-xs text-muted-foreground">{isNetPositive ? "A tu favor" : "En tu contra"}</p>
            </div>
            <p className={`text-lg font-semibold tabular-nums ${isNetPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
              {formatCurrency(Math.abs(netBalance))}
            </p>
          </div>
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-1 h-4 w-24" />
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </section>
      ) : loans.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-16 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <HandCoinsIcon className="size-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">No hay préstamos registrados</p>
            <p className="text-sm text-muted-foreground">
              Registra el dinero que prestas para hacerle seguimiento.
            </p>
          </div>
          <LoanDialog triggerLabel="Registrar primer préstamo" />
        </div>
      ) : (
        <>
          {/* Lent — active */}
          {activeLent.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-muted-foreground">
                Yo presté ({activeLent.length})
              </h2>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeLent.map((loan) => {
                  const pctPaid =
                    loan.amount > 0
                      ? Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100))
                      : 0

                  return (
                    <Card key={loan.id}>
                      <CardHeader className="flex flex-row items-start justify-between pb-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate text-base">{loan.personName}</CardTitle>
                          <CardDescription>
                            Prestado el{" "}
                            {format(new Date(`${loan.loanedOn}T12:00:00`), "d MMM yyyy", {
                              locale: es,
                            })}
                          </CardDescription>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {formatCurrency(loan.amount)}
                          </p>
                          {loan.expectedOn && (
                            <Badge variant="secondary" className="mt-1.5 text-xs font-normal">
                              Devolución:{" "}
                              {format(new Date(`${loan.expectedOn}T12:00:00`), "d MMM yyyy", {
                                locale: es,
                              })}
                            </Badge>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-muted-foreground"
                            >
                              <MoreHorizontalIcon />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditLoan(loan)}>
                              <PencilIcon />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setHistoryLoan(loan)}>
                              <HistoryIcon />
                              Historial de abonos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => setDeleteId(loan.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2Icon />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>

                      <CardContent className="flex flex-col gap-3">
                        <Progress value={pctPaid} className="[&>div]:bg-primary" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                          <span>Abonado: {formatCurrency(loan.paidAmount)}</span>
                          <span className="text-destructive font-medium">
                            Pendiente: {formatCurrency(loan.pendingAmount)}
                          </span>
                        </div>

                        {loan.notes && (
                          <p className="truncate text-xs text-muted-foreground">{loan.notes}</p>
                        )}

                        <RecordPaymentDialog loan={loan} />
                      </CardContent>
                    </Card>
                  )
                })}
              </section>
            </>
          )}

          {/* Borrowed — active */}
          {activeBorrowed.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-muted-foreground">
                Me prestaron ({activeBorrowed.length})
              </h2>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {activeBorrowed.map((loan) => {
                  const pctPaid =
                    loan.amount > 0
                      ? Math.min(100, Math.round((loan.paidAmount / loan.amount) * 100))
                      : 0
                  return (
                    <Card key={loan.id}>
                      <CardHeader className="flex flex-row items-start justify-between pb-3">
                        <div className="min-w-0 flex-1">
                          <CardTitle className="truncate text-base">{loan.personName}</CardTitle>
                          <CardDescription>
                            Recibido el{" "}
                            {format(new Date(`${loan.loanedOn}T12:00:00`), "d MMM yyyy", {
                              locale: es,
                            })}
                          </CardDescription>
                          <p className="mt-1 text-sm font-semibold tabular-nums">
                            {formatCurrency(loan.amount)}
                          </p>
                          {loan.expectedOn && (
                            <Badge variant="secondary" className="mt-1.5 text-xs font-normal">
                              Pagar antes del{" "}
                              {format(new Date(`${loan.expectedOn}T12:00:00`), "d MMM yyyy", {
                                locale: es,
                              })}
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
                            <DropdownMenuItem onSelect={() => setEditLoan(loan)}>
                              <PencilIcon />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setHistoryLoan(loan)}>
                              <HistoryIcon />
                              Historial de abonos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onSelect={() => setDeleteId(loan.id)} className="text-destructive focus:text-destructive">
                              <Trash2Icon />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-3">
                        <Progress value={pctPaid} className="[&>div]:bg-primary" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
                          <span>Pagado: {formatCurrency(loan.paidAmount)}</span>
                          <span className="text-destructive font-medium">
                            Pendiente: {formatCurrency(loan.pendingAmount)}
                          </span>
                        </div>
                        {loan.notes && (
                          <p className="truncate text-xs text-muted-foreground">{loan.notes}</p>
                        )}
                        <RecordPaymentDialog loan={loan} />
                      </CardContent>
                    </Card>
                  )
                })}
              </section>
            </>
          )}

          {/* Settled */}
          {(settledLent.length > 0 || settledBorrowed.length > 0) && (
            <>
              <h2 className="text-sm font-medium text-muted-foreground">
                Saldados ({settledLent.length + settledBorrowed.length})
              </h2>
              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {[...settledLent, ...settledBorrowed].map((loan) => (
                  <Card key={loan.id} className="opacity-60">
                    <CardHeader className="flex flex-row items-start justify-between pb-3">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="truncate text-base">{loan.personName}</CardTitle>
                        <CardDescription>
                          {loan.direction === "lent" ? "Presté · " : "Me prestaron · "}
                          {format(new Date(`${loan.loanedOn}T12:00:00`), "d MMM yyyy", { locale: es })}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
                            <MoreHorizontalIcon />
                            <span className="sr-only">Acciones</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditLoan(loan)}>
                            <PencilIcon />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => setDeleteId(loan.id)} className="text-destructive focus:text-destructive">
                            <Trash2Icon />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2Icon className="size-3.5" />
                        Saldado · {formatCurrency(loan.amount)}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            </>
          )}
        </>
      )}

      {editLoan && (
        <EditLoanDialog
          loan={editLoan}
          open={!!editLoan}
          onOpenChange={(o) => !o && setEditLoan(null)}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
        description="Se eliminará este préstamo y todo su historial de abonos permanentemente."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />

      <LoanPaymentHistoryDialog
        loan={historyLoan}
        open={!!historyLoan}
        onOpenChange={(o) => !o && setHistoryLoan(null)}
      />
    </main>
  )
}
