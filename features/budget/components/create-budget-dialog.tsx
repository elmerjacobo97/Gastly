"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { startOfMonth } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useRouter } from "next/navigation"
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
import { budgetSchema, type BudgetValues } from "@/features/budget/schemas/budget-schemas"
import { CategorySelect } from "@/components/category-select"
import { createBudget } from "@/features/budget/server/actions"
import { type Category } from "@/features/categories/types/category-types"

type CreateBudgetDialogProps = {
  triggerLabel?: string
  categories: Category[]
}

export function CreateBudgetDialog({
  triggerLabel = "Nuevo presupuesto",
  categories,
}: CreateBudgetDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const now = new Date()

  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetValues>,
    defaultValues: {
      categoryId: "",
      amount: 0,
      month: startOfMonth(now),
    },
  })

  function onSubmit(values: BudgetValues) {
    startTransition(async () => {
      try {
        await createBudget(values)
        toast.success("Presupuesto guardado")
        form.reset({ categoryId: "", amount: 0, month: startOfMonth(new Date()) })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast.error("No se pudo guardar el presupuesto", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

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
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <Controller
                control={form.control}
                name="categoryId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="cb-category">Categoría</FieldLabel>
                    <CategorySelect
                      categories={categories}
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
                  <MonthField
                    value={field.value}
                    invalid={fieldState.invalid}
                    error={fieldState.error}
                    onChange={field.onChange}
                  />
                )}
              />
            </FieldGroup>
          </form>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancelar</Button>
            </DialogClose>
            <Button disabled={isPending} form="create-budget-form" type="submit">
              {isPending && <Loader2Icon className="size-4 animate-spin" />}
              Guardar presupuesto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
