"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

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
import { DatePicker } from "@/components/ui/date-picker"
import { NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
import { useAddContribution } from "@/features/savings/hooks/mutations"
import {
  contributionSchema,
  type ContributionValues,
} from "@/features/savings/schemas/savings-schemas"
import { type SavingsGoal } from "@/features/savings/types/savings-types"

type AddContributionDialogProps = {
  goal: SavingsGoal
  trigger?: React.ReactNode
  defaultAmount?: number
}

function getToday() {
  return format(new Date(), "yyyy-MM-dd")
}

const emptyValues: ContributionValues = {
  amount: 0,
  occurredOn: "",
  notes: "",
}

export function AddContributionDialog({ goal, trigger, defaultAmount }: AddContributionDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<ContributionValues>({
    resolver: zodResolver(contributionSchema),
    defaultValues: { ...emptyValues, amount: defaultAmount ?? 0, occurredOn: getToday() },
  })

  const mutation = useAddContribution(goal)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm" disabled={goal.isCompleted}>
            <PlusIcon className="size-4" />
            Añadir aporte
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Añadir aporte</DialogTitle>
          <DialogDescription>
            Registra cuánto ahorras para <span className="font-medium">{goal.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <form
          id="contribution-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit((v) => mutation.mutate(v, {
            onSuccess: () => { form.reset({ ...emptyValues, amount: defaultAmount ?? 0, occurredOn: getToday() }); setOpen(false) },
          }))}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ac-amount">Monto</FieldLabel>
                  <NumberInput
                    {...field}
                    id="ac-amount"
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
              name="occurredOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ac-date">Fecha</FieldLabel>
                  <DatePicker
                    id="ac-date"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="ac-notes">
                    Notas <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Textarea {...field} id="ac-notes" placeholder="Detalle adicional" rows={2} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={mutation.isPending} form="contribution-form" type="submit">
            {mutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
