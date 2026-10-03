"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form";
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
import { NumberInput } from "@/components/ui/number-input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { reactivateRecurringPayment } from "@/features/recurring-payments/server/actions";
import {
  reactivateRecurringPaymentSchema,
  type ReactivateRecurringPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas";
import { type RecurringPayment } from "@/lib/recurring-payment-types";

type ReactivateRecurringPaymentDialogProps = {
  payment: RecurringPayment;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReactivateRecurringPaymentDialog({
  payment,
  open,
  onOpenChange,
}: ReactivateRecurringPaymentDialogProps) {
  const {
    amount,
    frequency: paymentFrequency,
    intervalMonths,
    nextDueOn,
  } = payment;

  const defaults = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return {
      amount,
      frequency: paymentFrequency,
      intervalMonths: intervalMonths ?? 2,
      nextDueOn: nextDueOn < today ? today : nextDueOn,
    };
  }, [amount, paymentFrequency, intervalMonths, nextDueOn]);

  const form = useForm<ReactivateRecurringPaymentValues>({
    resolver: zodResolver(
      reactivateRecurringPaymentSchema,
    ) as Resolver<ReactivateRecurringPaymentValues>,
    defaultValues: defaults,
    values: defaults,
  });

  const frequency = useWatch({ control: form.control, name: "frequency" });
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(values: ReactivateRecurringPaymentValues) {
    startTransition(async () => {
      try {
        await reactivateRecurringPayment(payment.id, values);
        toast.success("Pago recurrente activado");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error("No se pudo activar el pago recurrente", {
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
          <DialogTitle>Activar {payment.description}</DialogTitle>
          <DialogDescription>
            Confirma monto, frecuencia y próxima fecha. Empieza desde esta
            fecha.
          </DialogDescription>
        </DialogHeader>
        <form
          id="reactivate-recurring-payment-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rrp-amount">
                    Monto estimado (PEN)
                  </FieldLabel>
                  <NumberInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="rrp-amount"
                    inputMode="decimal"
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
            <div
              className={cn(
                "grid gap-3",
                frequency === "custom_months" && "sm:grid-cols-2",
              )}
            >
              <Controller
                control={form.control}
                name="frequency"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="rrp-frequency">Frecuencia</FieldLabel>
                    <NativeSelect
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="rrp-frequency"
                    >
                      <NativeSelectOption value="monthly">
                        Mensual
                      </NativeSelectOption>
                      <NativeSelectOption value="custom_months">
                        Cada X meses
                      </NativeSelectOption>
                      <NativeSelectOption value="yearly">
                        Anual
                      </NativeSelectOption>
                    </NativeSelect>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {frequency === "custom_months" && (
                <Controller
                  control={form.control}
                  name="intervalMonths"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="rrp-interval">
                        Intervalo (meses)
                      </FieldLabel>
                      <NumberInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id="rrp-interval"
                        inputMode="numeric"
                        min="1"
                        max="120"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
            </div>
            <Controller
              control={form.control}
              name="nextDueOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>
                    {payment.type === "income"
                      ? "Próxima fecha de cobro"
                      : "Próxima fecha de pago"}
                  </FieldLabel>
                  <DatePicker
                    id="rrp-next-due"
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
            form="reactivate-recurring-payment-form"
            type="submit"
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Activar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
