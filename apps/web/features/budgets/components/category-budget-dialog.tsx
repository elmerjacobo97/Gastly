"use client";

import { Loader2Icon } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { saveCategoryBudget } from "@/features/budgets/server/actions";
import { type CategoryBudget } from "@/features/budgets/types/budget-types";
import { type Category } from "@/lib/category-types";
import { CURRENCY_LABELS, type CurrencyCode } from "@/lib/format";

type CategoryBudgetDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  currency: CurrencyCode;
  categories: Category[];
  budget?: CategoryBudget;
};

export function CategoryBudgetDialog({
  open,
  onOpenChange,
  month,
  currency,
  categories,
  budget,
}: CategoryBudgetDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await saveCategoryBudget({
          categoryId: String(formData.get("categoryId") ?? ""),
          month,
          currency,
          amount: Number(formData.get("amount")),
        });
        toast.success(
          budget ? "Presupuesto actualizado" : "Presupuesto creado",
        );
        onOpenChange(false);
      } catch (error) {
        toast.error("No se pudo guardar el presupuesto", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {budget
              ? "Editar presupuesto por categoría"
              : "Nuevo presupuesto por categoría"}
          </DialogTitle>
          <DialogDescription>
            Límite para {month} en {CURRENCY_LABELS[currency]}.
          </DialogDescription>
        </DialogHeader>
        <form id="category-budget-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="budget-category">
                Categoría de gasto
              </FieldLabel>
              {budget && (
                <input
                  type="hidden"
                  name="categoryId"
                  value={budget.categoryId}
                />
              )}
              <NativeSelect
                id="budget-category"
                name="categoryId"
                defaultValue={budget?.categoryId ?? categories[0]?.id ?? ""}
                required
                disabled={Boolean(budget)}
              >
                {categories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <Field>
              <FieldLabel htmlFor="category-budget-amount">
                Límite ({currency})
              </FieldLabel>
              <Input
                id="category-budget-amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                inputMode="decimal"
                placeholder="0.00"
                defaultValue={budget?.amount ?? ""}
                required
              />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            form="category-budget-form"
            type="submit"
            disabled={isPending || categories.length === 0}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar límite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
