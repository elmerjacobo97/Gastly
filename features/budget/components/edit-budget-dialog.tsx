"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { startOfMonth } from "date-fns"
import { Loader2Icon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useTransition } from "react"
import { type Resolver, Controller, useForm } from "react-hook-form"
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
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { NumberInput } from "@/components/ui/number-input"
import { budgetSchema, type BudgetValues } from "@/features/budget/schemas/budget-schemas"
import { updateBudget } from "@/features/budget/server/actions"
import { type Budget } from "@/features/budget/types/budget-types"

type EditBudgetDialogProps = {
  budget: Budget
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditBudgetDialog({ budget, open, onOpenChange }: EditBudgetDialogProps) {
  const form = useForm<BudgetValues>({
    resolver: zodResolver(budgetSchema) as Resolver<BudgetValues>,
    defaultValues: {
      categoryId: budget.category.id,
      amount: budget.amount,
      month: startOfMonth(new Date(budget.month + "T12:00:00")),
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        categoryId: budget.category.id,
        amount: budget.amount,
        month: startOfMonth(new Date(budget.month + "T12:00:00")),
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function onSubmit(values: BudgetValues) {
    startTransition(async () => {
      try {
        await updateBudget(budget.id, values.amount)
        toast.success("Presupuesto actualizado")
        onOpenChange(false)
        router.refresh()
      } catch (error) {
        toast.error("No se pudo actualizar el presupuesto", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar presupuesto</DialogTitle>
          <DialogDescription>
            Modifica el monto límite para &ldquo;{budget.category.name}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          id="edit-budget-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eb-amount">Monto límite</FieldLabel>
                  <NumberInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="eb-amount"
                    inputMode="decimal"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
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
          <Button disabled={isPending} form="edit-budget-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
