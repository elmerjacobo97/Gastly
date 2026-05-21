"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startOfMonth } from "date-fns"
import { Loader2Icon, PencilIcon, PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import {
  registerSalaryIncome,
  upsertMonthlyPlan,
} from "@/features/monthly-plan/lib/monthly-plan-api"
import {
  monthlyPlanSchema,
  type MonthlyPlanValues,
} from "@/features/monthly-plan/schemas/monthly-plan-schemas"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" },
]

function getYearOptions() {
  const year = new Date().getFullYear()
  return [year - 1, year, year + 1]
}

function buildDefaultValues(month: Date, plan?: MonthlyPlan | null): MonthlyPlanValues {
  return {
    month: plan ? startOfMonth(new Date(`${plan.month}T12:00:00`)) : startOfMonth(month),
    expectedIncome: plan?.expectedIncome ?? 0,
    savingsMode: plan?.savingsMode ?? "percent",
    savingsValue: plan?.savingsValue ?? 20,
    notes: plan?.notes ?? "",
  }
}

function isCurrentMonth(month: Date) {
  const now = new Date()
  return month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()
}

type MonthlyPlanDialogProps = {
  month: Date
  plan?: MonthlyPlan | null
  triggerLabel?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function MonthlyPlanDialog({
  month,
  plan,
  triggerLabel = plan ? "Editar plan" : "Crear plan mensual",
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: MonthlyPlanDialogProps) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const [registerIncome, setRegisterIncome] = useState(!plan && isCurrentMonth(month))
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen
  const queryClient = useQueryClient()

  const form = useForm<MonthlyPlanValues>({
    resolver: zodResolver(monthlyPlanSchema),
    defaultValues: buildDefaultValues(month, plan),
  })

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(month, plan))
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      setRegisterIncome(!plan && isCurrentMonth(month))
    }
    setOpen(nextOpen)
  }

  const mutation = useMutation({
    mutationFn: async (values: MonthlyPlanValues) => {
      const savedPlan = await upsertMonthlyPlan(values)
      if (registerIncome && !savedPlan.salaryTransactionId) {
        await registerSalaryIncome(savedPlan)
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["monthly-plan"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
      ])
      setOpen(false)
      toast.success(registerIncome ? "Plan mensual y sueldo guardados" : "Plan mensual guardado")
    },
    onError: (error) => {
      toast.error("No se pudo guardar el plan mensual", { description: error.message })
    },
  })

  function onSubmit(values: MonthlyPlanValues) {
    mutation.mutate(values)
  }

  const canRegisterIncome = !plan?.salaryTransactionId

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              {plan ? (
                <PencilIcon data-icon="inline-start" />
              ) : (
                <PlusIcon data-icon="inline-start" />
              )}
              {triggerLabel}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{plan ? "Editar plan mensual" : "Nuevo plan mensual"}</DialogTitle>
          <DialogDescription>
            Define tu ingreso esperado y el ahorro que no quieres tocar este mes.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          id="monthly-plan-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="month"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Mes</FieldLabel>
                  <div className="flex gap-2">
                    <NativeSelect
                      value={field.value.getMonth()}
                      onChange={(event) => {
                        const date = new Date(field.value)
                        date.setMonth(Number(event.target.value))
                        field.onChange(startOfMonth(date))
                      }}
                      className="flex-1"
                    >
                      {MONTHS.map((monthOption) => (
                        <NativeSelectOption key={monthOption.value} value={monthOption.value}>
                          {monthOption.label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                    <NativeSelect
                      value={field.value.getFullYear()}
                      onChange={(event) => {
                        const date = new Date(field.value)
                        date.setFullYear(Number(event.target.value))
                        field.onChange(startOfMonth(date))
                      }}
                      className="w-28"
                    >
                      {getYearOptions().map((year) => (
                        <NativeSelectOption key={year} value={year}>
                          {year}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="expectedIncome"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="monthly-plan-income">Ingreso estimado en soles</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="monthly-plan-income"
                    inputMode="decimal"
                    min="0"
                    placeholder="2217.50"
                    step="0.01"
                    type="number"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <div className="grid gap-3 sm:grid-cols-[1fr_1.2fr]">
              <Controller
                control={form.control}
                name="savingsMode"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="monthly-plan-savings-mode">Ahorro</FieldLabel>
                    <NativeSelect
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="monthly-plan-savings-mode"
                    >
                      <NativeSelectOption value="percent">Porcentaje</NativeSelectOption>
                      <NativeSelectOption value="amount">Monto fijo</NativeSelectOption>
                    </NativeSelect>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="savingsValue"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="monthly-plan-savings-value">Valor</FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="monthly-plan-savings-value"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      type="number"
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="monthly-plan-notes">Notas</FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="monthly-plan-notes"
                    placeholder="Ej. 650 USD convertidos a soles"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {canRegisterIncome && (
              <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
                <Checkbox
                  checked={registerIncome}
                  onCheckedChange={(checked) => setRegisterIncome(checked === true)}
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-1">
                  <span className="font-medium">Registrar también como ingreso</span>
                  <span className="text-muted-foreground">
                    Crea una transacción de ingreso vinculada a este plan para no hacerlo manualmente.
                  </span>
                </span>
              </label>
            )}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button disabled={mutation.isPending} form="monthly-plan-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
