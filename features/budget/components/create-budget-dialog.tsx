"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { startOfMonth } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
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
import { budgetSchema, type BudgetValues } from "@/features/budget/schemas/budget-schemas"
import { createBudget } from "@/features/budget/lib/budget-api"
import { CategoryCombobox } from "@/features/categories/components/category-combobox"

const MONTHS = [
  { value: 0, label: "Enero" }, { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" }, { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" }, { value: 5, label: "Junio" },
  { value: 6, label: "Julio" }, { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" }, { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" }, { value: 11, label: "Diciembre" },
]

function getYearOptions() {
  const y = new Date().getFullYear()
  return [y - 1, y, y + 1]
}

type CreateBudgetDialogProps = {
  triggerLabel?: string
}

export function CreateBudgetDialog({ triggerLabel = "Nuevo presupuesto" }: CreateBudgetDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const now = new Date()

  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: "",
      amount: 0,
      month: startOfMonth(now),
    },
  })

  const mutation = useMutation({
    mutationFn: createBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      form.reset({ categoryId: "", amount: 0, month: startOfMonth(new Date()) })
      setOpen(false)
      toast.success("Presupuesto guardado")
    },
    onError: (error) => {
      toast.error("No se pudo guardar el presupuesto", { description: error.message })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-8 px-0 has-data-[icon=inline-start]:pl-0 sm:w-auto sm:px-2.5 sm:has-data-[icon=inline-start]:pl-2">
            <PlusIcon data-icon="inline-start" />
            <span className="sr-only sm:not-sr-only">{triggerLabel}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo presupuesto</DialogTitle>
            <DialogDescription>
              Define un límite de gasto por categoría para el mes seleccionado.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-5"
            id="create-budget-form"
            noValidate
            onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="cb-category">Categoría</FieldLabel>
                    <CategoryCombobox
                      id="cb-category"
                      value={field.value}
                      onChange={field.onChange}
                      type="expense"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="cb-amount">Monto límite</FieldLabel>
                    <NumberInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="cb-amount"
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
                name="month"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>Mes</FieldLabel>
                    <div className="flex gap-2">
                      <NativeSelect
                        value={field.value.getMonth()}
                        onChange={(e) => {
                          const d = new Date(field.value)
                          d.setMonth(Number(e.target.value))
                          field.onChange(startOfMonth(d))
                        }}
                        className="flex-1"
                      >
                        {MONTHS.map((m) => (
                          <NativeSelectOption key={m.value} value={m.value}>{m.label}</NativeSelectOption>
                        ))}
                      </NativeSelect>
                      <NativeSelect
                        value={field.value.getFullYear()}
                        onChange={(e) => {
                          const d = new Date(field.value)
                          d.setFullYear(Number(e.target.value))
                          field.onChange(startOfMonth(d))
                        }}
                        className="w-28"
                      >
                        {getYearOptions().map((y) => (
                          <NativeSelectOption key={y} value={y}>{y}</NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </div>
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
            <Button disabled={mutation.isPending} form="create-budget-form" type="submit">
              {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Guardar presupuesto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
