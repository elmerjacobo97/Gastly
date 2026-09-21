"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2Icon, WalletIcon } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
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
  DialogTrigger,
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
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  loanPaymentSchema,
  type LoanPaymentValues,
} from "@/features/loans/schemas/loan-schemas";
import { recordLoanPayment } from "@/features/loans/server/actions";
import {
  type Loan,
  type LoanCurrency,
  LOAN_CURRENCY_LABELS,
} from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type RecordPaymentDialogProps = {
  personName: string;
  balances: Loan[];
};

export function RecordPaymentDialog({
  personName,
  balances,
}: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const needsCurrency = balances.length > 1;
  const defaultLoan = balances[0];
  const [currency, setCurrency] = useState<LoanCurrency>(
    defaultLoan?.currency ?? "PEN",
  );
  const selected =
    balances.find((loan) => loan.currency === currency) ?? defaultLoan;

  const form = useForm<LoanPaymentValues>({
    resolver: zodResolver(loanPaymentSchema) as Resolver<LoanPaymentValues>,
    defaultValues: {
      amount: defaultLoan?.pendingAmount ?? 0,
      occurredOn: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  useEffect(() => {
    if (open && selected) {
      form.setValue("amount", selected.pendingAmount);
    }
  }, [open, selected, form]);

  function onSubmit(values: LoanPaymentValues) {
    if (!selected) return;
    startTransition(async () => {
      try {
        await recordLoanPayment(selected.id, values);
        toast.success("Abono registrado");
        form.reset({
          amount: selected.pendingAmount,
          occurredOn: format(new Date(), "yyyy-MM-dd"),
          notes: "",
        });
        setOpen(false);
      } catch (error) {
        toast.error("No se pudo registrar el abono", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  if (!selected) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <WalletIcon data-icon="inline-start" />
          Registrar abono
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Abono de {personName}</DialogTitle>
          <DialogDescription>
            Pendiente:{" "}
            {formatCurrency(selected.pendingAmount, selected.currency)}
          </DialogDescription>
        </DialogHeader>
        <form
          id="loan-payment-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            {needsCurrency && (
              <Field>
                <FieldLabel htmlFor="lp-currency">Moneda</FieldLabel>
                <NativeSelect
                  id="lp-currency"
                  value={currency}
                  onChange={(event) =>
                    setCurrency(event.target.value as LoanCurrency)
                  }
                >
                  {balances.map((loan) => (
                    <NativeSelectOption key={loan.id} value={loan.currency}>
                      {LOAN_CURRENCY_LABELS[loan.currency]}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lp-amount">Monto abonado</FieldLabel>
                    <NumberInput
                      {...field}
                      id="lp-amount"
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
                    <FieldLabel htmlFor="lp-date">Fecha</FieldLabel>
                    <DatePicker
                      id="lp-date"
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
                    id="lp-notes"
                    aria-invalid={fieldState.invalid}
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
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button disabled={isPending} form="loan-payment-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Confirmar abono
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
