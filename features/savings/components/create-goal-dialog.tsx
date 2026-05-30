"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, PlusIcon, Loader2Icon } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateSavingsGoal } from "@/features/savings/hooks/mutations"
import {
  GOAL_COLORS,
  savingsGoalSchema,
  type SavingsGoalValues,
} from "@/features/savings/schemas/savings-schemas"
import { cn } from "@/lib/utils"

const defaultValues: SavingsGoalValues = {
  name: "",
  targetAmount: 0,
  targetDate: "",
  color: "#1d42d0",
  notes: "",
}

type CreateGoalDialogProps = {
  trigger?: React.ReactNode
  onSuccess?: (id: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CreateGoalDialog({ trigger, onSuccess, open: controlledOpen, onOpenChange: controlledOnOpenChange }: CreateGoalDialogProps = {}) {
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const form = useForm<SavingsGoalValues>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues,
  })

  const mutation = useCreateSavingsGoal()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <PlusIcon data-icon="inline-start" />
              <span className="hidden sm:inline">Nueva meta</span>
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva meta de ahorro</DialogTitle>
          <DialogDescription>
            Define tu objetivo y empieza a ahorrar hacia él.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-goal-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={(e) => {
            e.stopPropagation()
            form.handleSubmit((v) => mutation.mutate(v, {
              onSuccess: (id: string) => { form.reset(defaultValues); setOpen(false); onSuccess?.(id) },
            }))(e)
          }}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="cg-name">Nombre</FieldLabel>
                  <Input
                    {...field}
                    id="cg-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej. Laptop nueva, Viaje a Europa"
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
                  <FieldLabel htmlFor="cg-amount">Monto objetivo</FieldLabel>
                  <NumberInput
                    {...field}
                    id="cg-amount"
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
                  <FieldLabel htmlFor="cg-date">
                    Fecha objetivo <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <DatePicker
                    id="cg-date"
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
                  <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                    {GOAL_COLORS.map((c) => (
                      <Button
                        key={c}
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => field.onChange(c)}
                        className={cn(
                          "rounded-full hover:bg-transparent hover:scale-110",
                          field.value === c && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={c}
                      >
                        {field.value === c && (
                          <CheckIcon className="size-3.5 text-white drop-shadow-sm" />
                        )}
                      </Button>
                    ))}
                  </div>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="cg-notes">
                    Notas <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Textarea {...field} id="cg-notes" placeholder="¿Para qué es esta meta?" rows={2} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={mutation.isPending} form="create-goal-form" type="submit">
            {mutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
            Crear meta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
