"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useEffect, useTransition } from "react";
import { type Resolver, Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
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
  loanPaymentSchema,
  type LoanPaymentValues,
} from "@/features/loans/schemas/loan-schemas";
import { recordLoanPayment } from "@/features/loans/server/actions";
import { type LoanMovementRow } from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type RecordPaymentDialogProps = {
  movement: LoanMovementRow;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function RecordPaymentDialog({
  movement,
  onOpenChange,
  open,
}: RecordPaymentDialogProps) {
  const [isPending, startTransition] = useTransition();
  const isLent = movement.direction === "lent";
  const form = useForm<LoanPaymentValues>({
    resolver: zodResolver(loanPaymentSchema) as Resolver<LoanPaymentValues>,
    defaultValues: {
      amount: movement.pendingAmount,
      occurredOn: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  useEffect(() => {
    if (open) form.setValue("amount", movement.pendingAmount);
  }, [form, movement.pendingAmount, open]);

  function onSubmit(values: LoanPaymentValues) {
    startTransition(async () => {
      try {
        await recordLoanPayment(movement.loanId, movement.id, values);
        toast.success(isLent ? "Devolución registrada" : "Pago registrado");
        onOpenChange(false);
      } catch (error) {
        toast.error(
          isLent
            ? "No se pudo registrar la devolución"
            : "No se pudo registrar el pago",
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
            {isLent ? "Registrar devolución" : "Registrar pago"}
          </DialogTitle>
          <DialogDescription>
            {movement.personName}
            {movement.description ? ` · ${movement.description}` : ""} ·
            Pendiente{" "}
            {formatCurrency(movement.pendingAmount, movement.currency)}
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-5"
          id="loan-payment-form"
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
                    <FieldLabel htmlFor="lp-amount">
                      {isLent ? "Monto recibido" : "Monto pagado"}
                    </FieldLabel>
                    <NumberInput
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="lp-amount"
                      inputMode="decimal"
                      max={movement.pendingAmount}
                      min="0"
                      placeholder="0.00"
                      step="0.01"
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
                    <FieldLabel htmlFor="lp-date">Fecha</FieldLabel>
                    <DatePicker
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="lp-date"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="lp-notes">
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="lp-notes"
                    placeholder="Ej: Transferencia BCP"
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
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button disabled={isPending} form="loan-payment-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isLent ? "Confirmar devolución" : "Confirmar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
