"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { startOfMonth } from "date-fns"
import { Loader2Icon, PencilIcon } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { type Resolver, Controller, useForm } from "react-hook-form"

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
import { upsertMonthlyPlan } from "@/features/monthly-plan/server/actions"
import {
  monthlyPlanSchema,
  type MonthlyPlanValues,
} from "@/features/monthly-plan/schemas/monthly-plan-schemas"
import { type MonthlyPlan } from "@/features/monthly-plan/types/monthly-plan-types"

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

  const [isPending, startTransition] = useTransition()

  function onSubmit(values: MonthlyPlanValues) {
    startTransition(async () => {
      try {
        await upsertMonthlyPlan(values)
        toast.success("Plan actualizado")
        setOpen(false)
      } catch (error) {
        toast.error("No se pudo actualizar el plan", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

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
          <Button disabled={isPending} form="edit-monthly-plan-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
