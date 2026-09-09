"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { startOfMonth } from "date-fns"
import { CopyIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { type Resolver, Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { MonthField } from "@/components/month-field"
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
import { getPrevMonthPlan, upsertMonthlyPlan } from "@/features/monthly-plan/server/actions"
import {
  monthlyPlanSchema,
  type MonthlyPlanValues,
} from "@/features/monthly-plan/schemas/monthly-plan-schemas"

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

  const form = useForm<MonthlyPlanValues>({
    resolver: zodResolver(monthlyPlanSchema) as Resolver<MonthlyPlanValues>,
    defaultValues: buildDefaultValues(month),
  })

  const [prevPlan, setPrevPlan] = useState<MonthlyPlanValues | null>(null)
  const [, startPrevLoad] = useTransition()

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) {
      form.reset(buildDefaultValues(month))
      startPrevLoad(async () => {
        const prev = await getPrevMonthPlan(month)
        setPrevPlan(prev)
      })
    }
    setOpen(nextOpen)
  }

  function copyFromPrevMonth() {
    if (!prevPlan) return
    form.setValue("savingsMode", prevPlan.savingsMode)
    form.setValue("savingsValue", prevPlan.savingsValue)
    if (prevPlan.notes) form.setValue("notes", prevPlan.notes)
    toast.info("Valores copiados del mes anterior")
  }

  const [isPending, startTransition] = useTransition()

  function onSubmit(values: MonthlyPlanValues) {
    startTransition(async () => {
      try {
        await upsertMonthlyPlan(values)
        toast.success("Plan mensual guardado")
        form.reset(buildDefaultValues(month))
        setOpen(false)
      } catch (error) {
        toast.error("No se pudo guardar el plan", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

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
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="month"
                render={({ field, fieldState }) => (
                  <MonthField
                    value={field.value}
                    invalid={fieldState.invalid}
                    error={fieldState.error}
                    onChange={field.onChange}
                  />
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
            {prevPlan && (
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
          <Button disabled={isPending} form="create-monthly-plan-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
