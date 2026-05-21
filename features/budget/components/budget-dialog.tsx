"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { startOfMonth } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { getCategories } from "@/features/categories/lib/categories-api"
import {
  type BudgetValues,
  budgetSchema,
} from "@/features/budget/schemas/budget-schemas"
import {
  createBudget,
  updateBudget,
} from "@/features/budget/lib/budget-api"
import { type Budget } from "@/features/budget/types/budget-types"

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

type BudgetDialogProps = {
  triggerLabel?: string
  budget?: Budget
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function BudgetDialog({
  triggerLabel = "Nuevo presupuesto",
  budget,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: BudgetDialogProps) {
  const isEditing = !!budget
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen

  const queryClient = useQueryClient()
  const now = new Date()

  const defaultMonth = budget
    ? startOfMonth(new Date(budget.month + "T12:00:00"))
    : startOfMonth(now)

  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: budget?.category.id ?? "",
      amount: budget?.amount ?? 0,
      month: defaultMonth,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: budget?.category.id ?? "",
        amount: budget?.amount ?? 0,
        month: defaultMonth,
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const categoriesQuery = useQuery({
    queryKey: ["categories", "expense"],
    queryFn: () => getCategories("expense"),
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: createBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      form.reset({ categoryId: "", amount: 0, month: startOfMonth(now) })
      setOpen(false)
      toast.success("Presupuesto guardado")
    },
    onError: (error) => {
      toast.error("No se pudo guardar el presupuesto", { description: error.message })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: BudgetValues) => updateBudget(budget!.id, values.amount),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      setOpen(false)
      toast.success("Presupuesto actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el presupuesto", { description: error.message })
    },
  })

  const mutation = isEditing ? updateMutation : createMutation

  function onSubmit(values: BudgetValues) {
    mutation.mutate(values)
  }

  const currentMonth = form.watch("month")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button>
            <PlusIcon data-icon="inline-start" />
            {triggerLabel}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar presupuesto" : "Nuevo presupuesto"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? `Modifica el monto límite para "${budget.category.name}".`
              : "Define un límite de gasto por categoría para el mes seleccionado."}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          id="budget-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            {!isEditing && (
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="budget-category">Categoría</FieldLabel>
                    <NativeSelect {...field} aria-invalid={fieldState.invalid} id="budget-category">
                      <NativeSelectOption value="">Selecciona una categoría</NativeSelectOption>
                      {categoriesQuery.data?.map((c) => (
                        <NativeSelectOption key={c.id} value={c.id}>{c.name}</NativeSelectOption>
                      ))}
                    </NativeSelect>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            )}
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="budget-amount">Monto límite</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="budget-amount"
                    inputMode="decimal"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            {!isEditing && (
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
            )}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button disabled={mutation.isPending} form="budget-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isEditing ? "Guardar cambios" : "Guardar presupuesto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
