"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PlusIcon, Loader2Icon } from "lucide-react"
import { useState, useTransition } from "react"
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
import { createSavingsGoal } from "@/features/savings/server/actions"
import {
  GOAL_COLORS,
  savingsGoalSchema,
  type SavingsGoalValues,
} from "@/features/savings/schemas/savings-schemas"

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
  const [isPending, startTransition] = useTransition()
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const form = useForm<SavingsGoalValues>({
    resolver: zodResolver(savingsGoalSchema) as Resolver<SavingsGoalValues>,
    defaultValues,
  })

  function onSubmit(values: SavingsGoalValues) {
    startTransition(async () => {
      try {
        const id = await createSavingsGoal(values)
        toast.success("Meta de ahorro creada")
        form.reset(defaultValues)
        setOpen(false)
        onSuccess?.(id)
      } catch (error) {
        toast.error("No se pudo crear la meta", {
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
            form.handleSubmit(onSubmit)(e)
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
          <Button disabled={isPending} form="create-goal-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Crear meta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
