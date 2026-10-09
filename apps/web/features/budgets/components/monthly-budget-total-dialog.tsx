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
import { saveMonthlyBudgetTotal } from "@/features/budgets/server/actions";
import { type MonthlyBudgetTotal } from "@/features/budgets/types/budget-types";
import { CURRENCY_LABELS, type CurrencyCode } from "@/lib/format";

type MonthlyBudgetTotalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  month: string;
  currency: CurrencyCode;
  budget?: MonthlyBudgetTotal;
};

export function MonthlyBudgetTotalDialog({
  open,
  onOpenChange,
  month,
  currency,
  budget,
}: MonthlyBudgetTotalDialogProps) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      try {
        await saveMonthlyBudgetTotal({
          month,
          currency,
          amount: Number(formData.get("amount")),
        });
        toast.success(
          budget ? "Límite global actualizado" : "Límite global creado",
        );
        onOpenChange(false);
      } catch (error) {
        toast.error("No se pudo guardar el límite global", {
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
            {budget ? "Editar límite global" : "Definir límite global"}
          </DialogTitle>
          <DialogDescription>
            Límite total de gastos para {month} en {CURRENCY_LABELS[currency]}.
          </DialogDescription>
        </DialogHeader>
        <form id="monthly-budget-total-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="monthly-budget-amount">
                Límite ({currency})
              </FieldLabel>
              <Input
                id="monthly-budget-amount"
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
            form="monthly-budget-total-form"
            type="submit"
            disabled={isPending}
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar límite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
