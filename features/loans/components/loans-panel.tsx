"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  CheckCircle2Icon,
  HandCoinsIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { EditLoanDialog } from "@/features/loans/components/edit-loan-dialog"
import { LoanDialog } from "@/features/loans/components/loan-dialog"
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog"
import { deleteLoan, getLoans } from "@/features/loans/lib/loans-api"
import { type Loan, type LoanCurrency } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

const currencyOrder: LoanCurrency[] = ["PEN", "USD", "MXN"]

function formatCurrencyTotals(loans: Loan[]) {
  const totals = loans.reduce(
    (acc, loan) => {
      acc[loan.currency] += loan.pendingAmount
      return acc
    },
    { PEN: 0, USD: 0, MXN: 0 } satisfies Record<LoanCurrency, number>
  )

  const values = currencyOrder
    .filter((currency) => totals[currency] > 0)
    .map((currency) => formatCurrency(totals[currency], currency))

  return values.length > 0 ? values.join(" · ") : formatCurrency(0)
}

export function LoansPanel() {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editLoan, setEditLoan] = useState<Loan | null>(null)
  const queryClient = useQueryClient()

  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteLoan,
    onSuccess: async () => {
      setDeleteId(null)
      await queryClient.invalidateQueries({ queryKey: ["loans"] })
      toast.success("Préstamo eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar", { description: error.message })
    },
  })

  const active = loans.filter((l) => !l.isSettled)
  const settled = loans.filter((l) => l.isSettled)
  const activeLent = active.filter((l) => l.direction === "lent")
  const activeBorrowed = active.filter((l) => l.direction === "borrowed")
  const settledLent = settled.filter((l) => l.direction === "lent")
  const settledBorrowed = settled.filter((l) => l.direction === "borrowed")
  const totalToReceive = formatCurrencyTotals(activeLent)
  const totalToPay = formatCurrencyTotals(activeBorrowed)

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Préstamos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Dinero prestado a otras personas. Registra abonos para hacer seguimiento.
          </p>
        </div>
        <LoanDialog />
      </section>

      {/* Summary cards */}
      {!isLoading && loans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Me deben</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {totalToReceive}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeLent.length} préstamo{activeLent.length !== 1 ? "s" : ""} pendiente{activeLent.length !== 1 ? "s" : ""} de cobro
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Debo</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-destructive">
              {totalToPay}
            </p>
            <p className="text-xs text-muted-foreground">
              {activeBorrowed.length} deuda{activeBorrowed.length !== 1 ? "s" : ""} pendiente{activeBorrowed.length !== 1 ? "s" : ""} de pago
            </p>
          </Card>
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
                          <span>Abonado: {formatCurrency(loan.paidAmount, loan.currency)}</span>
                          <span className="text-destructive font-medium">
                            Pendiente: {formatCurrency(loan.pendingAmount, loan.currency)}
                          </span>
                        </div>

                        {loan.notes && (
                          <p className="text-xs text-muted-foreground">{loan.notes}</p>
                        )}

                        {loan.payments.length > 0 && (
                          <ul className="flex flex-col gap-0.5 border-t pt-2">
                            {loan.payments.map((p) => (
                              <li
                                key={p.id}
                                className="flex items-center justify-between text-xs text-muted-foreground"
                              >
                                <span>
                                  {format(new Date(`${p.occurredOn}T12:00:00`), "d MMM yyyy", {
                                    locale: es,
                                  })}
                                  {p.notes && ` · ${p.notes}`}
                                </span>
                                <span className="tabular-nums text-emerald-600 dark:text-emerald-400">
                                  +{formatCurrency(p.amount, loan.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
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
                          <span>Pagado: {formatCurrency(loan.paidAmount, loan.currency)}</span>
                          <span className="text-destructive font-medium">
                            Pendiente: {formatCurrency(loan.pendingAmount, loan.currency)}
                          </span>
                        </div>
                        {loan.notes && (
                          <p className="text-xs text-muted-foreground">{loan.notes}</p>
                        )}
                        {loan.payments.length > 0 && (
                          <ul className="flex flex-col gap-0.5 border-t pt-2">
                            {loan.payments.map((p) => (
                              <li key={p.id} className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>
                                  {format(new Date(`${p.occurredOn}T12:00:00`), "d MMM yyyy", { locale: es })}
                                  {p.notes && ` · ${p.notes}`}
                                </span>
                                <span className="tabular-nums text-foreground">
                                  -{formatCurrency(p.amount, loan.currency)}
                                </span>
                              </li>
                            ))}
                          </ul>
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
                        Saldado · {formatCurrency(loan.amount, loan.currency)}
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
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </main>
  )
}
