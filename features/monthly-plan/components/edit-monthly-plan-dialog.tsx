"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { startOfMonth } from "date-fns"
import { Loader2Icon, PencilIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { type Resolver, Controller, useForm } from "react-hook-form"

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
import { useUpsertMonthlyPlan } from "@/lib/finance/monthly-plan/hooks/mutations"
import {
  monthlyPlanSchema,
  type MonthlyPlanValues,
} from "@/lib/finance/monthly-plan/schemas/monthly-plan-schemas"
import { type MonthlyPlan } from "@/lib/finance/monthly-plan/types/monthly-plan-types"

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

function buildDefaultValues(plan: MonthlyPlan): MonthlyPlanValues {
  return {
    month: startOfMonth(new Date(`${plan.month}T12:00:00`)),
    savingsMode: plan.savingsMode,
    savingsValue: plan.savingsValue,
    notes: plan.notes ?? "",
  }
}

type EditMonthlyPlanDialogProps = {
  month: Date
  plan: MonthlyPlan
  triggerLabel?: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditMonthlyPlanDialog({
  plan,
  triggerLabel = "Editar plan",
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: EditMonthlyPlanDialogProps) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const form = useForm<MonthlyPlanValues>({
    resolver: zodResolver(monthlyPlanSchema) as Resolver<MonthlyPlanValues>,
    defaultValues: buildDefaultValues(plan),
  })

  useEffect(() => {
    if (open) form.reset(buildDefaultValues(plan))
  }, [open, plan.month]) // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useUpsertMonthlyPlan()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <PencilIcon data-icon="inline-start" />
              {triggerLabel}
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar plan mensual</DialogTitle>
          <DialogDescription>
            Ajusta tu meta de ahorro para este mes.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          id="edit-monthly-plan-form"
          noValidate
          onSubmit={form.handleSubmit((v) => mutation.mutate(v, { onSuccess: () => setOpen(false) }))}
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
                    <FieldLabel htmlFor="emp-savings-mode">Ahorro</FieldLabel>
                    <NativeSelect {...field} aria-invalid={fieldState.invalid} id="emp-savings-mode">
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
                    <FieldLabel htmlFor="emp-savings-value">Valor</FieldLabel>
                    <NumberInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="emp-savings-value"
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
                  <FieldLabel htmlFor="emp-notes">Notas <span className="text-muted-foreground">(opcional)</span></FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="emp-notes"
                    placeholder="Ej. Mes con bono de fin de año"
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
          <Button disabled={mutation.isPending} form="edit-monthly-plan-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
