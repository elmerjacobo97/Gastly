"use client"

import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { CheckCircle2Icon, HandCoinsIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { LoanDialog } from "@/features/loans/components/loan-dialog"
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog"
import { getLoans } from "@/features/loans/lib/loans-api"
import { formatCurrency } from "@/lib/format"

export function LoansPanel() {
  const { data: loans = [], isLoading } = useQuery({
    queryKey: ["loans"],
    queryFn: getLoans,
  })

  const active = loans.filter((l) => !l.isSettled)
  const settled = loans.filter((l) => l.isSettled)
  const totalLoaned = active.reduce((s, l) => s + l.amount, 0)
  const totalPending = active.reduce((s, l) => s + l.pendingAmount, 0)
  const totalReceived = active.reduce((s, l) => s + l.paidAmount, 0)

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        Cargando préstamos…
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Préstamos</h1>
        <LoanDialog />
      </div>

      {loans.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Préstamos activos</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {active.length}
            </p>
            <p className="text-xs text-muted-foreground tabular-nums">
              {formatCurrency(totalLoaned)} prestado
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Pendiente de cobro</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-destructive">
              {formatCurrency(totalPending)}
            </p>
            <p className="text-xs text-muted-foreground">
              {settled.length} préstamo{settled.length !== 1 ? "s" : ""} saldado
              {settled.length !== 1 ? "s" : ""}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Ya recibido</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalReceived)}
            </p>
            <p className="text-xs text-muted-foreground">de préstamos activos</p>
          </Card>
        </div>
      )}

      {loans.length === 0 ? (
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
          {active.length > 0 && (
            <div className="flex flex-col gap-3">
              {active.map((loan) => (
                <div key={loan.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{loan.personName}</p>
                        <Badge variant="outline" className="text-xs font-normal">
                          {format(new Date(`${loan.loanedOn}T12:00:00`), "d MMM yyyy", {
                            locale: es,
                          })}
                        </Badge>
                        {loan.expectedOn && (
                          <Badge variant="secondary" className="text-xs font-normal">
                            Devolución esperada:{" "}
                            {format(new Date(`${loan.expectedOn}T12:00:00`), "d MMM yyyy", {
                              locale: es,
                            })}
                          </Badge>
                        )}
                      </div>
                      {loan.notes && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{loan.notes}</p>
                      )}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                        <div>
                          <span className="text-muted-foreground">Prestado: </span>
                          <span className="font-medium">{formatCurrency(loan.amount)}</span>
                        </div>
                        {loan.paidAmount > 0 && (
                          <div>
                            <span className="text-muted-foreground">Abonado: </span>
                            <span className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCurrency(loan.paidAmount)}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Pendiente: </span>
                          <span className="font-semibold text-destructive">
                            {formatCurrency(loan.pendingAmount)}
                          </span>
                        </div>
                      </div>
                      {loan.payments.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-0.5">
                          {loan.payments.map((p) => (
                            <li key={p.id} className="text-xs text-muted-foreground">
                              Abono{" "}
                              {format(new Date(`${p.occurredOn}T12:00:00`), "d MMM yyyy", {
                                locale: es,
                              })}
                              : {formatCurrency(p.amount)}
                              {p.notes && ` — ${p.notes}`}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <RecordPaymentDialog loan={loan} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {settled.length > 0 && (
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted-foreground">Saldados</h2>
              <div className="flex flex-col gap-2 opacity-60">
                {settled.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center gap-3 rounded-lg border px-4 py-3"
                  >
                    <CheckCircle2Icon className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{loan.personName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(loan.amount)} ·{" "}
                        {format(new Date(`${loan.loanedOn}T12:00:00`), "d MMM yyyy", {
                          locale: es,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
