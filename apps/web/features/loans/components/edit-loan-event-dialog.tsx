"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { type Resolver, Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  loanDisbursementSchema,
  type LoanDisbursementValues,
} from "@/features/loans/schemas/loan-schemas";
import {
  updateLoanDisbursement,
  updateLoanPayment,
} from "@/features/loans/server/actions";
import { type LoanHistoryEntry } from "@/features/loans/types/loan-types";

type EditLoanEventDialogProps = {
  entry: LoanHistoryEntry;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditLoanEventDialog({
  entry,
  open,
  onOpenChange,
}: EditLoanEventDialogProps) {
  const isPayment = entry.kind === "payment";
  const defaults = useMemo(
    () => ({
      amount: entry.amount,
      occurredOn: entry.occurredOn,
      description: entry.description ?? "",
      notes: entry.notes ?? "",
      interestRate: entry.interestRate,
    }),
    [
      entry.amount,
      entry.occurredOn,
      entry.description,
      entry.notes,
      entry.interestRate,
    ],
  );

  const form = useForm<LoanDisbursementValues>({
    resolver: zodResolver(
      loanDisbursementSchema,
    ) as Resolver<LoanDisbursementValues>,
    defaultValues: defaults,
    values: defaults,
  });

  const [isPending, startTransition] = useTransition();

  function onSubmit(values: LoanDisbursementValues) {
    startTransition(async () => {
      try {
        if (isPayment) {
          await updateLoanPayment(entry.id, values);
          toast.success("Abono actualizado");
        } else {
          await updateLoanDisbursement(entry.id, values);
          toast.success("Préstamo actualizado");
        }
        onOpenChange(false);
      } catch (error) {
        toast.error(
          isPayment
            ? "No se pudo actualizar el abono"
            : "No se pudo actualizar el préstamo",
          {
            description:
              error instanceof Error ? error.message : "Inténtalo de nuevo.",
          },
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isPayment ? "Editar abono" : "Editar préstamo"}
          </DialogTitle>
          <DialogDescription>
            {isPayment
              ? "Corrige el monto, la fecha o las notas de este abono."
              : "Corrige el monto, la fecha, el motivo o las notas de este préstamo."}
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-loan-event-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ee-amount">Monto</FieldLabel>
                    <NumberInput
                      {...field}
                      id="ee-amount"
                      aria-invalid={fieldState.invalid}
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="occurredOn"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ee-date">Fecha</FieldLabel>
                    <DatePicker
                      id="ee-date"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            {!isPayment && (
              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ee-description">
                      Motivo{" "}
                      <span className="font-normal text-muted-foreground">
                        (opcional)
                      </span>
                    </FieldLabel>
                    <Input
                      {...field}
                      id="ee-description"
                      aria-invalid={fieldState.invalid}
                      placeholder="Ej: Pollo de pico rico"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
            {!isPayment && (
              <Controller
                control={form.control}
                name="interestRate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ee-interest">
                      Interés mensual (%){" "}
                      <span className="font-normal text-muted-foreground">
                        (opc.)
                      </span>
                    </FieldLabel>
                    <NumberInput
                      {...field}
                      id="ee-interest"
                      aria-invalid={fieldState.invalid}
                      inputMode="decimal"
                      max="100"
                      min="0"
                      placeholder="0"
                      step="0.1"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}
            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ee-notes">
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="ee-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder={
                      isPayment
                        ? "Ej: Yape"
                        : "Ej: Acordado devolver en 2 partes"
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            disabled={isPending}
            form="edit-loan-event-form"
            type="submit"
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
