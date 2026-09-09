"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useEffect, useTransition } from "react"
import { toast } from "sonner"
import { type Resolver, Controller, useForm } from "react-hook-form"

import { ColorPicker } from "@/components/color-picker"
import { Button } from "@/components/ui/button"
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
import { updateSavingsGoal } from "@/features/savings/server/actions"
import {
  GOAL_COLORS,
  savingsGoalSchema,
  type SavingsGoalValues,
} from "@/features/savings/schemas/savings-schemas"
import { type SavingsGoal } from "@/features/savings/types/savings-types"

type EditGoalDialogProps = {
  goal: SavingsGoal
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildValues(goal: SavingsGoal): SavingsGoalValues {
  return {
    name: goal.name,
    targetAmount: goal.targetAmount,
    targetDate: goal.targetDate ?? "",
    color: goal.color,
    notes: goal.notes ?? "",
  }
}

export function EditGoalDialog({ goal, open, onOpenChange }: EditGoalDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<SavingsGoalValues>({
    resolver: zodResolver(savingsGoalSchema) as Resolver<SavingsGoalValues>,
    defaultValues: buildValues(goal),
  })

  useEffect(() => {
    if (open) form.reset(buildValues(goal))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: SavingsGoalValues) {
    startTransition(async () => {
      try {
        await updateSavingsGoal(goal.id, values)
        toast.success("Meta actualizada")
        onOpenChange(false)
      } catch (error) {
        toast.error("No se pudo actualizar la meta", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar meta</DialogTitle>
          <DialogDescription>Modifica los datos de tu meta de ahorro.</DialogDescription>
        </DialogHeader>
        <form
          id="edit-goal-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eg-name">Nombre</FieldLabel>
                  <Input
                    {...field}
                    id="eg-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej. Laptop nueva"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="targetAmount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eg-amount">Monto objetivo</FieldLabel>
                  <NumberInput
                    {...field}
                    id="eg-amount"
                    aria-invalid={fieldState.invalid}
                    inputMode="decimal"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="targetDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eg-date">
                    Fecha objetivo <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <DatePicker
                    id="eg-date"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <ColorPicker
                    options={GOAL_COLORS}
                    value={field.value}
                    onChange={field.onChange}
                  />
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="eg-notes">
                    Notas <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Textarea {...field} id="eg-notes" placeholder="¿Para qué es esta meta?" rows={2} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={isPending} form="edit-goal-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
