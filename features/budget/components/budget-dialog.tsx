"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format, startOfMonth, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2Icon, PlusIcon, Trash2Icon } from "lucide-react"
import { useState } from "react"
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
import { getCategories } from "@/features/transactions/lib/transactions-api"
import {
  type BudgetValues,
  budgetSchema,
} from "@/features/budget/schemas/budget-schemas"
import { createBudget, deleteBudget } from "@/features/budget/lib/budget-api"

type BudgetDialogProps = {
  triggerLabel?: string
}

const MONTHS = [
  { value: 0, label: "Enero" },
  { value: 1, label: "Febrero" },
  { value: 2, label: "Marzo" },
  { value: 3, label: "Abril" },
  { value: 4, label: "Mayo" },
  { value: 5, label: "Junio" },
  { value: 6, label: "Julio" },
  { value: 7, label: "Agosto" },
  { value: 8, label: "Septiembre" },
  { value: 9, label: "Octubre" },
  { value: 10, label: "Noviembre" },
  { value: 11, label: "Diciembre" },
]

function getYearOptions() {
  const current = new Date().getFullYear()
  return [current - 1, current, current + 1]
}

export function BudgetDialog({
  triggerLabel = "Nuevo presupuesto",
}: BudgetDialogProps) {
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
    mode: "onChange",
  })

  const categoriesQuery = useQuery({
    queryKey: ["categories", "expense"],
    queryFn: () => getCategories("expense"),
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
      toast.error("No se pudo guardar el presupuesto", {
        description: error.message,
      })
    },
  })

  function onSubmit(values: BudgetValues) {
    createMutation.mutate(values)
  }

  const currentMonth = form.watch("month")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          {triggerLabel}
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
          id="budget-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="budget-category">Categoría</FieldLabel>
                  <NativeSelect
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="budget-category"
                  >
                    <NativeSelectOption value="">
                      Selecciona una categoría
                    </NativeSelectOption>
                    {categoriesQuery.data?.map((category) => (
                      <NativeSelectOption key={category.id} value={category.id}>
                        {category.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
                        <NativeSelectOption key={m.value} value={m.value}>
                          {m.label}
                        </NativeSelectOption>
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
                        <NativeSelectOption key={y} value={y}>
                          {y}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button
            disabled={createMutation.isPending}
            form="budget-form"
            type="submit"
          >
            {createMutation.isPending && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            Guardar presupuesto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type BudgetDeleteButtonProps = {
  budgetId: string
}

export function BudgetDeleteButton({ budgetId }: BudgetDeleteButtonProps) {
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: deleteBudget,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["budgets"] })
      toast.success("Presupuesto eliminado")
    },
    onError: (error) => {
      toast.error("No se pudo eliminar el presupuesto", {
        description: error.message,
      })
    },
  })

  return (
    <Button
      disabled={mutation.isPending}
      onClick={() => mutation.mutate(budgetId)}
      size="icon"
      variant="ghost"
      className="text-muted-foreground hover:text-destructive"
    >
      {mutation.isPending ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <Trash2Icon className="size-4" />
      )}
    </Button>
  )
}
