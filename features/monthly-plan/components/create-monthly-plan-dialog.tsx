"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { startOfMonth, subMonths } from "date-fns"
import { CopyIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
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
import { NumberInput } from "@/components/ui/number-input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"
import { upsertMonthlyPlan } from "@/features/monthly-plan/lib/monthly-plan-api"
import {
  monthlyPlanSchema,
  type MonthlyPlanValues,
} from "@/features/monthly-plan/schemas/monthly-plan-schemas"
import { getMonthlyPlan } from "@/features/monthly-plan/lib/monthly-plan-api"

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

function buildDefaultValues(month: Date): MonthlyPlanValues {
  return {
    month: startOfMonth(month),
    savingsMode: "percent",
    savingsValue: 20,
    notes: "",
  }
}

type CreateMonthlyPlanDialogProps = {
  month: Date
  triggerLabel?: string
  trigger?: React.ReactNode
}

export function CreateMonthlyPlanDialog({
  month,
  triggerLabel = "Crear plan mensual",
  trigger,
}: CreateMonthlyPlanDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<MonthlyPlanValues>({
    resolver: zodResolver(monthlyPlanSchema),
    defaultValues: buildDefaultValues(month),
  })

  const prevMonthQuery = useQuery({
    queryKey: ["monthly-plan", subMonths(startOfMonth(month), 1).toISOString().slice(0, 7)],
    queryFn: () => getMonthlyPlan(subMonths(month, 1)),
    enabled: open,
  })

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) form.reset(buildDefaultValues(month))
    setOpen(nextOpen)
  }

  function copyFromPrevMonth() {
    const prev = prevMonthQuery.data
    if (!prev) return
    form.setValue("savingsMode", prev.savingsMode)
    form.setValue("savingsValue", prev.savingsValue)
    if (prev.notes) form.setValue("notes", prev.notes)
    toast.info("Valores copiados del mes anterior")
  }

  const mutation = useMutation({
    mutationFn: (values: MonthlyPlanValues) => upsertMonthlyPlan(values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["monthly-plan"] }),
      ])
      form.reset(buildDefaultValues(month))
      setOpen(false)
      toast.success("Plan mensual guardado")
    },
    onError: (error) => {
      toast.error("No se pudo guardar el plan mensual", { description: error.message })
    },
  })

  const hasPrevMonth = !!prevMonthQuery.data

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <PlusIcon data-icon="inline-start" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo plan mensual</DialogTitle>
          <DialogDescription>
            Define cuánto quieres ahorrar este mes. El ingreso disponible se calcula automáticamente desde tus transacciones reales.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          id="create-monthly-plan-form"
          noValidate
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
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
                      {MONTHS.map((m) => (
                        <NativeSelectOption key={m.value} value={m.value}>{m.label}</NativeSelectOption>
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
                        <NativeSelectOption key={year} value={year}>{year}</NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
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
                    <FieldLabel htmlFor="cmp-savings-mode">Ahorro</FieldLabel>
                    <NativeSelect {...field} aria-invalid={fieldState.invalid} id="cmp-savings-mode">
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
                    <FieldLabel htmlFor="cmp-savings-value">Valor</FieldLabel>
                    <NumberInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="cmp-savings-value"
                      inputMode="decimal"
                      min="0"
                      step="0.01"
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
                  <FieldLabel htmlFor="cmp-notes">Notas <span className="text-muted-foreground">(opcional)</span></FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="cmp-notes"
                    placeholder="Ej. Mes con bono de fin de año"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {hasPrevMonth && (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start gap-2 border-dashed text-muted-foreground hover:text-foreground"
                onClick={copyFromPrevMonth}
              >
                <CopyIcon className="size-4 shrink-0" />
                Copiar ahorro del mes anterior
              </Button>
            )}
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={mutation.isPending} form="create-monthly-plan-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
