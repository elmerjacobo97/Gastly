"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import {
  AlertTriangleIcon,
  CalendarClockIcon,
  CalendarIcon,
  CheckCircle2Icon,
  Loader2Icon,
  MoreHorizontalIcon,
  PauseCircleIcon,
  PencilIcon,
  PlayCircleIcon,
  ReceiptTextIcon,
  XCircleIcon,
  Trash2Icon,
} from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import {
  Dialog,
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
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { FixedExpenseDialog } from "@/features/fixed-expenses/components/fixed-expense-dialog"
import {
  deleteFixedExpense,
  getFixedExpenses,
  registerFixedExpensePayment,
  setFixedExpenseActive,
} from "@/features/fixed-expenses/lib/fixed-expenses-api"
import {
  fixedExpensePaymentSchema,
  type FixedExpensePaymentValues,
} from "@/features/fixed-expenses/schemas/fixed-expense-schemas"
import { type FixedExpense } from "@/features/fixed-expenses/types/fixed-expense-types"
import { MonthNav } from "@/components/month-nav"
import {
  formatCurrency,
  formatDate,
} from "@/features/transactions/lib/format-transaction"
import { cn } from "@/lib/utils"

function isRelevantForMonth(expense: FixedExpense, monthKey: string) {
  if (expense.frequency === "monthly") return true
  return expense.nextDueOn.startsWith(monthKey) || expense.paidOn?.startsWith(monthKey)
}

function formatFrequency(expense: FixedExpense) {
  if (expense.frequency === "monthly") return "Mensual"
  if (expense.frequency === "yearly") return "Anual"
  return `Cada ${expense.intervalMonths} meses`
}

function getPaymentBadge(expense: FixedExpense, monthKey: string) {
  if (!expense.isActive) {
    return {
      label: "Pausado",
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground",
    }
  }
  if (expense.paidOn) {
    return {
      label: "Pagado",
      variant: "secondary" as const,
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    }
  }
  if (!isRelevantForMonth(expense, monthKey)) {
    return {
      label: "Próximo",
      variant: "outline" as const,
      className: "text-muted-foreground",
    }
  }

  const today = new Date()
  const dueDate = new Date(`${expense.nextDueOn}T12:00:00`)
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysUntilDue < 0) {
    return {
      label: "Vencido",
      variant: "destructive" as const,
      className: undefined,
    }
  }
  if (daysUntilDue <= 7) {
    return {
      label: "Vence pronto",
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
  expense: FixedExpense | null
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: FixedExpensePaymentValues) => void
}

function PaymentDialog({
  expense,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: PaymentDialogProps) {
  const form = useForm<FixedExpensePaymentValues>({
    resolver: zodResolver(fixedExpensePaymentSchema),
    values: {
      amount: expense?.amount ?? 0,
      occurredOn: expense?.nextDueOn ?? new Date().toISOString().slice(0, 10),
      notes: expense?.notes ?? "",
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Ingresa el monto real pagado. El pago quedará como movimiento en soles.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          id="fixed-expense-payment-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="fixed-expense-payment-amount">Monto real en soles</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="fixed-expense-payment-amount"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    type="number"
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
                  <FieldLabel>Fecha real de pago</FieldLabel>
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
                  <FieldLabel htmlFor="fixed-expense-payment-notes">Notas</FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="fixed-expense-payment-notes"
                    placeholder="Opcional"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button disabled={pending} form="fixed-expense-payment-form" type="submit">
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            Registrar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function FixedExpensesPanel() {
  const [month, setMonth] = useState(() => new Date())
  const [editExpense, setEditExpense] = useState<FixedExpense | null>(null)
  const [payExpense, setPayExpense] = useState<FixedExpense | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["fixed-expenses", month.toISOString().slice(0, 7)],
    queryFn: () => getFixedExpenses(month),
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
      queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
      queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["budgets"] }),
    ])
  }

  const registerMutation = useMutation({
    mutationFn: (values: FixedExpensePaymentValues) =>
      registerFixedExpensePayment(payExpense!, values),
    onSuccess: async () => {
      setPayExpense(null)
      await invalidate()
      toast.success("Pago registrado como movimiento")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el pago", { description: error.message })
    },
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setFixedExpenseActive(id, active),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] })
      toast.success(variables.active ? "Gasto fijo activado" : "Gasto fijo pausado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el estado", { description: error.message })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteFixedExpense,
    onSuccess: async () => {
      setDeleteId(null)
      await queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] })
      toast.success("Gasto fijo eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar el gasto fijo", { description: error.message })
    },
  })

  const expenses = query.data ?? []
  const monthKey = month.toISOString().slice(0, 7)
  const activeRegistered = expenses.filter((expense) => expense.isActive)
  const activeExpenses = expenses.filter(
    (expense) => expense.isActive && isRelevantForMonth(expense, monthKey)
  )
  const totalRegistered = activeRegistered.reduce((sum, expense) => sum + expense.amount, 0)
  const totalCommitted = activeExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const totalPaid = activeExpenses
    .filter((expense) => expense.paidOn)
    .reduce((sum, expense) => sum + (expense.paidAmount ?? expense.amount), 0)
  const totalPending = Math.max(totalCommitted - totalPaid, 0)

  const today = new Date()
  const unpaidActive = activeExpenses.filter((e) => !e.paidOn)
  const overdueExpenses = unpaidActive.filter(
    (e) => new Date(`${e.nextDueOn}T12:00:00`) < today
  )
  const soonExpenses = unpaidActive.filter((e) => {
    const days = Math.ceil(
      (new Date(`${e.nextDueOn}T12:00:00`).getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24)
    )
    return days >= 0 && days <= 7
  })

  function daysLabel(nextDueOn: string) {
    const days = Math.ceil(
      (new Date(`${nextDueOn}T12:00:00`).getTime() - today.getTime()) /
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
          <FixedExpenseDialog />
        </div>
      </section>

      {!query.isLoading && expenses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">A pagar este mes</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(totalCommitted)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Total recurrentes activos</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(totalRegistered)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Pagado este mes</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalPaid)}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground">Falta pagar este mes</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-amber-600 dark:text-amber-400">
              {formatCurrency(totalPending)}
            </p>
          </Card>
        </div>
      )}

      {!query.isLoading && (overdueExpenses.length > 0 || soonExpenses.length > 0) && (
        <div className="flex flex-col gap-2">
          {overdueExpenses.length > 0 && (
            <Alert variant="destructive">
              <XCircleIcon />
              <AlertTitle>
                {overdueExpenses.length === 1
                  ? `"${overdueExpenses[0].description}" está vencido`
                  : `${overdueExpenses.length} pagos vencidos`}
              </AlertTitle>
              <AlertDescription>
                {overdueExpenses.length === 1
                  ? `Vencía el ${formatDate(overdueExpenses[0].nextDueOn)}. Registra el pago para mantener el control.`
                  : overdueExpenses.map((e) => e.description).join(", ")}
              </AlertDescription>
            </Alert>
          )}
          {soonExpenses.length > 0 && (
            <Alert variant="warning">
              <AlertTriangleIcon />
              <AlertTitle>
                {soonExpenses.length === 1
                  ? `"${soonExpenses[0].description}" ${daysLabel(soonExpenses[0].nextDueOn)}`
                  : `${soonExpenses.length} pagos próximos a vencer`}
              </AlertTitle>
              <AlertDescription>
                {soonExpenses.length === 1
                  ? formatCurrency(soonExpenses[0].amount)
                  : soonExpenses
                      .map((e) => `${e.description} (${daysLabel(e.nextDueOn)})`)
                      .join(", ")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {query.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="mt-1 h-4 w-24" />
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))
          : expenses.map((expense) => {
              const isPaid = !!expense.paidOn
              const badge = getPaymentBadge(expense, monthKey)

              return (
                <Card
                  key={expense.id}
                  className={cn(!expense.isActive && "opacity-70")}
                >
                  <CardHeader className="flex flex-row items-start justify-between pb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {expense.category && (
                          <CategoryIconBadge
                            icon={expense.category.icon}
                            color={expense.category.color}
                            className="size-7 rounded-md"
                          />
                        )}
                        <CardTitle className="truncate text-base">
                          {expense.description}
                        </CardTitle>
                      </div>
                      <CardDescription className="mt-0.5">
                        {expense.paidOn
                          ? `Pagado el ${formatDate(expense.paidOn)}`
                          : `Próximo pago: ${formatDate(expense.nextDueOn)}`} · {expense.category?.name ?? "Sin categoría"}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground"
                        >
                          <MoreHorizontalIcon />
                          <span className="sr-only">Acciones</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditExpense(expense)}>
                          <PencilIcon />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            activeMutation.mutate({
                              id: expense.id,
                              active: !expense.isActive,
                            })
                          }
                        >
                          {expense.isActive ? <PauseCircleIcon /> : <PlayCircleIcon />}
                          {expense.isActive ? "Pausar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onSelect={() => setDeleteId(expense.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2Icon />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-2xl font-semibold tabular-nums">
                        {formatCurrency(expense.paidAmount ?? expense.amount)}
                      </p>
                      <Badge variant={badge.variant} className={badge.className}>
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{formatFrequency(expense)}</span>
                      <span>·</span>
                      <span>{expense.paymentKind === "fixed" ? "Monto fijo" : "Monto variable"}</span>
                    </div>
                    <Button
                      disabled={!expense.isActive || isPaid || registerMutation.isPending}
                      onClick={() => setPayExpense(expense)}
                      variant={isPaid ? "secondary" : "default"}
                      className="w-full"
                    >
                      {isPaid ? <CheckCircle2Icon /> : <ReceiptTextIcon />}
                      {isPaid ? "Pago registrado" : "Registrar pago"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
      </section>

      {!query.isLoading && expenses.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <Empty className="border bg-muted/20">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarClockIcon />
                </EmptyMedia>
                <EmptyTitle>Sin gastos fijos aún</EmptyTitle>
                <EmptyDescription>
                  Crea tus pagos recurrentes para saber cuánto tienes estimado y qué falta pagar.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <FixedExpenseDialog />
              </EmptyContent>
            </Empty>
          </CardContent>
        </Card>
      )}

      <FixedExpenseDialog
        expense={editExpense ?? undefined}
        open={!!editExpense}
        onOpenChange={(open) => !open && setEditExpense(null)}
      />
      <PaymentDialog
        expense={payExpense}
        open={!!payExpense}
        pending={registerMutation.isPending}
        onOpenChange={(open) => !open && setPayExpense(null)}
        onSubmit={(values) => registerMutation.mutate(values)}
      />
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar gasto fijo"
        description="Esta acción no elimina movimientos ya registrados, solo el gasto fijo recurrente."
        confirmLabel="Eliminar"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </main>
  )
}
