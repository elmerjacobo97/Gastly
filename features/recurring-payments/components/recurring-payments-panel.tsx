"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { format } from "date-fns"
import { es } from "date-fns/locale"
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  ClockIcon,
  InfoIcon,
  CalendarIcon,
  CheckCircle2Icon,
  HistoryIcon,
  Loader2Icon,
  MoreHorizontalIcon,
  PauseCircleIcon,
  PencilIcon,
  PlayCircleIcon,
  RefreshCwIcon,
  ReceiptTextIcon,
  XCircleIcon,
  Trash2Icon,
} from "lucide-react"
import { useEffect, useState } from "react"
import { type Resolver, Controller, useForm } from "react-hook-form"

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { NumberInput } from "@/components/ui/number-input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { CategoryIconBadge } from "@/components/category-icon-badge"
import { CreateRecurringPaymentDialog } from "@/features/recurring-payments/components/create-recurring-payment-dialog"
import { EditRecurringPaymentDialog } from "@/features/recurring-payments/components/edit-recurring-payment-dialog"
import {
  type PaymentHistoryEntry,
} from "@/lib/finance/recurring-payments/lib/recurring-payments-api"
import { useRecurringPayments, useRecurringPaymentHistory } from "@/lib/finance/recurring-payments/hooks/queries"
import {
  useDeleteRecurringPayment,
  useSetRecurringPaymentActive,
  useRegisterRecurringPaymentPayment,
} from "@/lib/finance/recurring-payments/hooks/mutations"
import {
  recurringPaymentPaymentSchema,
  type RecurringPaymentPaymentValues,
} from "@/lib/finance/recurring-payments/schemas/recurring-payment-schemas"
import { type RecurringPayment } from "@/lib/finance/recurring-payments/types/recurring-payment-types"
import { MonthNav } from "@/components/month-nav"
import {
  formatCurrency,
  formatDate,
} from "@/lib/format"
import { cn } from "@/lib/utils"

function isRelevantForMonth(payment: RecurringPayment, monthKey: string) {
  if (payment.frequency === "monthly") return true
  return payment.nextDueOn.startsWith(monthKey) || payment.paidOn?.startsWith(monthKey)
}

function formatFrequency(payment: RecurringPayment) {
  if (payment.frequency === "monthly") return "Mensual"
  if (payment.frequency === "yearly") return "Anual"
  return `Cada ${payment.intervalMonths} meses`
}

function getPaymentBadge(payment: RecurringPayment, monthKey: string) {
  if (!payment.isActive) {
    return {
      label: "Pausado",
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground",
    }
  }
  if (payment.paidOn) {
    return {
      label: payment.type === "income" ? "Cobrado" : "Pagado",
      variant: "secondary" as const,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    }
  }
  if (!isRelevantForMonth(payment, monthKey)) {
    return {
      label: "Próximo",
      variant: "outline" as const,
      className: "text-muted-foreground",
    }
  }

  const todayDateStr = format(new Date(), "yyyy-MM-dd")
  const daysUntilDue = Math.round(
    (new Date(`${payment.nextDueOn}T12:00:00`).getTime() - new Date(`${todayDateStr}T12:00:00`).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  if (daysUntilDue < 0) {
    return {
      label: payment.type === "income" ? "No cobrado" : "Vencido",
      variant: "destructive" as const,
      className: undefined,
    }
  }
  if (daysUntilDue <= 7) {
    return {
      label: payment.type === "income" ? "Próximo cobro" : "Vence pronto",
      variant: "secondary" as const,
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    }
  }
  return {
    label: "Pendiente",
    variant: "secondary" as const,
    className: undefined,
  }
}

type PaymentDialogProps = {
  payment: RecurringPayment | null
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RecurringPaymentPaymentValues) => void
}

function PaymentDialog({
  payment,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: PaymentDialogProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const isPayingEarly = !!payment && payment.nextDueOn > todayStr

  const form = useForm<RecurringPaymentPaymentValues>({
    resolver: zodResolver(recurringPaymentPaymentSchema) as Resolver<RecurringPaymentPaymentValues>,
    defaultValues: {
      amount: payment?.amount ?? 0,
      occurredOn: isPayingEarly ? todayStr : (payment?.nextDueOn ?? todayStr),
      notes: payment?.notes ?? "",
    },
  })

  useEffect(() => {
    if (open && payment) {
      const today = format(new Date(), "yyyy-MM-dd")
      form.reset({
        amount: payment.amount,
        occurredOn: payment.nextDueOn > today ? today : payment.nextDueOn,
        notes: payment.notes ?? "",
      })
    }
  }, [open, payment?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const isIncome = payment?.type === "income"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isIncome ? "Registrar cobro" : "Registrar pago"}</DialogTitle>
          <DialogDescription>
            {isIncome
              ? "Ingresa el monto real cobrado. Quedará registrado como ingreso."
              : "Ingresa el monto real pagado. El pago quedará registrado como transacción."}
          </DialogDescription>
        </DialogHeader>
        {isPayingEarly && (
          <Alert variant="info">
            <InfoIcon />
            <AlertTitle>Pago anticipado</AlertTitle>
            <AlertDescription>
              Vencimiento: {formatDate(payment.nextDueOn)}. La fecha de pago se pre-llenó con hoy, pero puedes cambiarla.
            </AlertDescription>
          </Alert>
        )}
        <form
          className="flex flex-col gap-5"
          id="recurring-payment-payment-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rpp-amount">{isIncome ? "Monto real cobrado" : "Monto real pagado"}</FieldLabel>
                  <NumberInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="rpp-amount"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="occurredOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>{isIncome ? "Fecha real de cobro" : "Fecha real de pago"}</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        aria-invalid={fieldState.invalid}
                        type="button"
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon />
                        {field.value ? formatDate(field.value) : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(`${field.value}T12:00:00`) : undefined}
                        onSelect={(date) => {
                          if (date) field.onChange(format(date, "yyyy-MM-dd"))
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rpp-notes">Notas</FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="rpp-notes"
                    placeholder="Opcional"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={pending} form="recurring-payment-payment-form" type="submit">
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            {isIncome ? "Registrar cobro" : "Registrar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function PaymentHistoryDialog({
  payment,
  open,
  onOpenChange,
}: {
  payment: RecurringPayment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const historyQuery = useRecurringPaymentHistory(payment?.id, open && !!payment)

  const entries: PaymentHistoryEntry[] = historyQuery.data ?? []
  const total = entries.reduce((sum, e) => sum + e.amount, 0)
  const avg = entries.length > 0 ? total / entries.length : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Historial de pagos</DialogTitle>
          <DialogDescription>
            {payment?.description} · {entries.length} pago{entries.length !== 1 ? "s" : ""} registrado{entries.length !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          {historyQuery.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : historyQuery.isError ? (
            <Alert variant="destructive">
              <AlertTriangleIcon />
              <AlertTitle>No se pudo cargar el historial</AlertTitle>
              <AlertDescription>
                {historyQuery.error instanceof Error
                  ? historyQuery.error.message
                  : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
              </AlertDescription>
              <AlertAction>
                <Button size="sm" variant="outline" onClick={() => historyQuery.refetch()}>
                  <RefreshCwIcon className="size-3.5" />
                  Reintentar
                </Button>
              </AlertAction>
            </Alert>
          ) : entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Sin pagos registrados aún.
            </p>
          ) : (
            <>
              <ScrollArea className="max-h-72">
                <div className="flex flex-col divide-y">
                {entries.map((entry) => (
                  <div key={entry.id} className="flex items-start justify-between gap-3 py-3 first:pt-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {format(new Date(`${entry.occurredOn}T12:00:00`), "MMMM yyyy", { locale: es })}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{formatDate(entry.occurredOn)}</p>
                      {entry.notes && (
                        <p className="mt-0.5 text-xs text-muted-foreground italic">{entry.notes}</p>
                      )}
                    </div>
                    <span className={`shrink-0 text-sm font-semibold tabular-nums ${payment?.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                      {payment?.type === "income" ? "+" : "-"}{formatCurrency(entry.amount)}
                    </span>
                  </div>
                ))}
                </div>
              </ScrollArea>
              <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Promedio mensual</span>
                <span className="font-semibold tabular-nums">{formatCurrency(avg)}</span>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function RecurringPaymentsPanel() {
  const [month, setMonth] = useState(() => new Date())
  const [editPayment, setEditPayment] = useState<RecurringPayment | null>(null)
  const [payPayment, setPayPayment] = useState<RecurringPayment | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [historyPayment, setHistoryPayment] = useState<RecurringPayment | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const query = useRecurringPayments(month)
  const registerMutation = useRegisterRecurringPaymentPayment(payPayment)
  const activeMutation = useSetRecurringPaymentActive()
  const deleteMutation = useDeleteRecurringPayment()

  const payments = query.data ?? []
  const monthKey = format(month, "yyyy-MM")
  const activeExpensePayments = payments.filter(
    (p) => p.type === "expense" && p.isActive && isRelevantForMonth(p, monthKey)
  )
  const totalCommitted = activeExpensePayments.reduce((sum, p) => sum + p.amount, 0)
  const paidPayments = activeExpensePayments.filter((p) => p.paidOn)
  const totalPaid = paidPayments.reduce((sum, p) => sum + (p.paidAmount ?? p.amount), 0)
  const totalPending = Math.max(totalCommitted - totalPaid, 0)
  const allPaid = totalPending === 0

  const todayStr = format(new Date(), "yyyy-MM-dd")
  const unpaidActive = activeExpensePayments.filter((p) => !p.paidOn)
  const overduePayments = unpaidActive.filter((p) => p.nextDueOn < todayStr)
  const soonPayments = unpaidActive.filter((p) => {
    const days = Math.round(
      (new Date(`${p.nextDueOn}T12:00:00`).getTime() - new Date(`${todayStr}T12:00:00`).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    return days >= 0 && days <= 7
  })

  function daysLabel(nextDueOn: string) {
    const days = Math.round(
      (new Date(`${nextDueOn}T12:00:00`).getTime() - new Date(`${todayStr}T12:00:00`).getTime()) /
        (1000 * 60 * 60 * 24)
    )
    if (days === 0) return "vence hoy"
    if (days === 1) return "vence mañana"
    return `vence en ${days} días`
  }

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Pagos recurrentes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Usa montos estimados para planificar y registra el monto real cuando pagues.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNav value={month} onChange={setMonth} allowFuture />
          <CreateRecurringPaymentDialog />
        </div>
      </section>

      {query.isError && (
        <Alert variant="destructive">
          <AlertTriangleIcon />
          <AlertTitle>No se pudo cargar la información</AlertTitle>
          <AlertDescription>
            {query.error instanceof Error
              ? query.error.message
              : "Intenta recargar la información. Si el problema continúa, vuelve a intentarlo más tarde."}
          </AlertDescription>
          <AlertAction>
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              <RefreshCwIcon className="size-3.5" />
              Reintentar
            </Button>
          </AlertAction>
        </Alert>
      )}

      {!query.isLoading && payments.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className={`grid size-8 shrink-0 place-items-center rounded-lg ${allPaid ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-muted/50 text-muted-foreground"}`}>
              <CalendarIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Programado este mes</p>
              {allPaid && <p className="truncate text-xs text-muted-foreground">todo pagado</p>}
            </div>
            <p className={`text-lg font-semibold tabular-nums ${allPaid ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"}`}>
              {formatCurrency(totalCommitted)}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Pagado este mes</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalPaid)}
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ClockIcon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-muted-foreground">Falta pagar este mes</p>
            </div>
            <p className="text-lg font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {formatCurrency(totalPending)}
            </p>
          </div>
        </div>
      )}

      {!query.isLoading && (overduePayments.length > 0 || soonPayments.length > 0) && (
        <div className="flex flex-col gap-2">
          {overduePayments.length > 0 && (
            <Alert variant="destructive">
              <XCircleIcon />
              <AlertTitle>
                {overduePayments.length === 1
                  ? `"${overduePayments[0].description}" está vencido`
                  : `${overduePayments.length} pagos vencidos`}
              </AlertTitle>
              <AlertDescription>
                {overduePayments.length === 1
                  ? `Vencía el ${formatDate(overduePayments[0].nextDueOn)}. Registra el pago para mantener el control.`
                  : overduePayments.map((p) => p.description).join(", ")}
              </AlertDescription>
            </Alert>
          )}
          {soonPayments.length > 0 && (
            <Alert variant="warning">
              <AlertTriangleIcon />
              <AlertTitle>
                {soonPayments.length === 1
                  ? `"${soonPayments[0].description}" ${daysLabel(soonPayments[0].nextDueOn)}`
                  : `${soonPayments.length} pagos próximos a vencer`}
              </AlertTitle>
              <AlertDescription>
                {soonPayments.length === 1
                  ? formatCurrency(soonPayments[0].amount)
                  : soonPayments
                      .map((p) => `${p.description} (${daysLabel(p.nextDueOn)})`)
                      .join(", ")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {query.isLoading ? (
            <div className="flex flex-col divide-y px-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-4">
                  <Skeleton className="size-8 rounded-lg shrink-0" />
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-5 w-16 shrink-0" />
                  <Skeleton className="h-8 w-28 shrink-0" />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {payments.map((payment) => {
                const isPaid = !!payment.paidOn
                const badge = getPaymentBadge(payment, monthKey)
                const isIncome = payment.type === "income"
                return (
                  <div
                    key={payment.id}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3.5",
                      !payment.isActive && "opacity-60"
                    )}
                  >
                    {payment.category && (
                      <CategoryIconBadge
                        icon={payment.category.icon}
                        color={payment.category.color}
                        className="size-8 shrink-0 rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium">{payment.description}</p>
                        {isIncome && (
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded px-1 py-0.5">
                            Ingreso
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {payment.paidOn
                          ? `${isIncome ? "Cobrado" : "Pagado"} el ${formatDate(payment.paidOn)}`
                          : `${isIncome ? "Cobro" : "Vence"} el ${formatDate(payment.nextDueOn)}`}
                        {payment.account && (
                          <>
                            {" · "}
                            <span style={{ color: payment.account.color }}>
                              {payment.account.name}
                            </span>
                          </>
                        )}
                        {" · "}{formatFrequency(payment)}
                      </p>
                    </div>
                    <p className={`shrink-0 text-sm font-semibold tabular-nums ${isIncome ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                      {isIncome ? "+" : ""}{formatCurrency(payment.paidAmount ?? payment.amount)}
                    </p>
                    <Badge variant={badge.variant} className={cn("shrink-0 hidden sm:inline-flex", badge.className)}>
                      {badge.label}
                    </Badge>
                    <Button
                      size="sm"
                      disabled={!payment.isActive || isPaid || registerMutation.isPending}
                      onClick={() => { setPayPayment(payment); setPayOpen(true) }}
                      variant={isPaid ? "secondary" : "default"}
                      className="shrink-0 h-8"
                    >
                      {isPaid ? <CheckCircle2Icon className="size-3.5" /> : <ReceiptTextIcon className="size-3.5" />}
                      {isPaid ? (isIncome ? "Cobrado" : "Pagado") : (isIncome ? "Cobrar" : "Pagar")}
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
                          <MoreHorizontalIcon />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditPayment(payment)}>
                          <PencilIcon />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setHistoryPayment(payment)}>
                          <HistoryIcon />
                          Historial de pagos
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() => activeMutation.mutate({ id: payment.id, active: !payment.isActive })}
                        >
                          {payment.isActive ? <PauseCircleIcon /> : <PlayCircleIcon />}
                          {payment.isActive ? "Pausar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setDeleteId(payment.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2Icon />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {!query.isLoading && !query.isError && payments.length === 0 && (
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
                <CreateRecurringPaymentDialog />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

      {editPayment && (
        <EditRecurringPaymentDialog
          payment={editPayment}
          open={!!editPayment}
          onOpenChange={(open) => !open && setEditPayment(null)}
        />
      )}
      <PaymentDialog
        payment={payPayment}
        open={payOpen}
        pending={registerMutation.isPending}
        onOpenChange={(open) => setPayOpen(open)}
        onSubmit={(values) => registerMutation.mutate(values, { onSuccess: () => setPayOpen(false) })}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar pago recurrente"
        description="Esta acción no elimina transacciones ya registradas, solo el pago recurrente."
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId, { onSuccess: () => setDeleteId(null) })}
      />
      <PaymentHistoryDialog
        payment={historyPayment}
        open={!!historyPayment}
        onOpenChange={(open) => !open && setHistoryPayment(null)}
      />
    </main>
  )
}
