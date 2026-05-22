"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon, Loader2Icon } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
import { createSavingsGoal } from "@/features/savings/lib/savings-api"
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

export function CreateGoalDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<SavingsGoalValues>({
    resolver: zodResolver(savingsGoalSchema),
    defaultValues,
  })

  const mutation = useMutation({
    mutationFn: createSavingsGoal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["savings-goals"] })
      form.reset(defaultValues)
      setOpen(false)
      toast.success("Meta creada")
    },
    onError: (error) => {
      toast.error("No se pudo crear la meta", { description: error.message })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">Nueva meta</span>
        </Button>
      </DialogTrigger>
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
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
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
                  <Input
                    {...field}
                    id="cg-date"
                    aria-invalid={fieldState.invalid}
                    type="date"
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
                  <div className="flex flex-wrap gap-2">
                    {GOAL_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => field.onChange(c)}
                        className={cn(
                          "size-7 rounded-full ring-offset-background transition-all",
                          field.value === c
                            ? "ring-2 ring-ring ring-offset-2"
                            : "hover:scale-110"
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={c}
                      />
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
