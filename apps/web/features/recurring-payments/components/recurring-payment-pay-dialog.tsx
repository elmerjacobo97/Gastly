"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, InfoIcon, Loader2Icon } from "lucide-react";
import { useEffect, useMemo } from "react";
import {
  type Control,
  type Resolver,
  Controller,
  useForm,
  useWatch,
} from "react-hook-form";

import { CurrencyField } from "@/components/currency-field";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import {
  recurringPaymentPaymentSchema,
  type RecurringPaymentPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas";
import { type RecurringPayment } from "@/lib/recurring-payment-types";
import { type CurrencyCode, formatCurrency, formatDate } from "@/lib/format";

type RecurringPaymentPayDialogProps = {
  payment: RecurringPayment | null;
  open: boolean;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: RecurringPaymentPaymentValues) => void;
};

const COPY = {
  income: {
    title: "Registrar cobro",
    description:
      "Ingresa el monto real cobrado. Quedará registrado como ingreso.",
    amountLabel: "cobrado",
  },
  expense: {
    title: "Registrar pago",
    description:
      "Ingresa el monto real pagado. El pago quedará registrado como transacción.",
    amountLabel: "pagado",
  },
} as const;

function buildPayDefaults(payment: RecurringPayment | null) {
  const today = format(new Date(), "yyyy-MM-dd");
  const dueOn = payment?.nextDueOn ?? "";

  return {
    amount: payment?.amount ?? 0,
    currency: payment?.currency ?? "PEN",
    occurredOn: dueOn > today ? today : dueOn || today,
    notes: payment?.notes ?? "",
  };
}

function accountAmountMessage(isIncome: boolean, currency: CurrencyCode) {
  return `Ingresa cuánto ${isIncome ? "se abonó" : "salió"} de la cuenta en ${currency}.`;
}

export function RecurringPaymentPayDialog({
  payment,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: RecurringPaymentPayDialogProps) {
  const defaults = useMemo(() => buildPayDefaults(payment), [payment]);

  const form = useForm<RecurringPaymentPaymentValues>({
    resolver: zodResolver(
      recurringPaymentPaymentSchema,
    ) as Resolver<RecurringPaymentPaymentValues>,
    defaultValues: defaults,
  });

  const paymentId = payment?.id;
  useEffect(() => {
    if (open && paymentId) form.reset(defaults);
  }, [open, paymentId, defaults, form]);

  const selectedCurrency = useWatch({
    control: form.control,
    name: "currency",
  });
  const accountCurrency = payment?.account?.currency;
  const showAccountAmount =
    !!accountCurrency && accountCurrency !== selectedCurrency;
  const isIncome = payment?.type === "income";
  const copy = COPY[isIncome ? "income" : "expense"];

  function handleValid(values: RecurringPaymentPaymentValues) {
    if (showAccountAmount && !values.accountAmount) {
      form.setError("accountAmount", {
        message: accountAmountMessage(isIncome, accountCurrency),
      });
      return;
    }
    onSubmit({
      ...values,
      accountAmount: showAccountAmount ? values.accountAmount : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
        {payment && <PayDialogAlerts payment={payment} isIncome={isIncome} />}
        <form
          className="flex flex-col gap-5"
          id="recurring-payment-payment-form"
          noValidate
          onSubmit={form.handleSubmit(handleValid)}
        >
          <PayFormFields
            control={form.control}
            payment={payment}
            isIncome={isIncome}
            amountLabel={copy.amountLabel}
            selectedCurrency={selectedCurrency}
            showAccountAmount={showAccountAmount}
          />
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancelar
          </DialogClose>
          <Button
            disabled={pending}
            form="recurring-payment-payment-form"
            type="submit"
          >
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            {copy.title}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type PayFormFieldsProps = {
  control: Control<RecurringPaymentPaymentValues>;
  payment: RecurringPayment | null;
  isIncome: boolean;
  amountLabel: string;
  selectedCurrency: CurrencyCode;
  showAccountAmount: boolean;
};

function PayFormFields({
  control,
  payment,
  isIncome,
  amountLabel,
  selectedCurrency,
  showAccountAmount,
}: PayFormFieldsProps) {
  const isForeign = !!payment && payment.currency !== "PEN";

  return (
    <FieldGroup>
      {isForeign && (
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <CurrencyField
              id="rpp-currency"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      )}
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="rpp-amount">
              Monto real {amountLabel} ({selectedCurrency})
            </FieldLabel>
            <NumberInput
              {...field}
              aria-invalid={fieldState.invalid}
              id="rpp-amount"
              inputMode="decimal"
              min="0"
              step="0.01"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {showAccountAmount && payment?.account && (
        <AccountAmountField
          control={control}
          accountName={payment.account.name}
          accountCurrency={payment.account.currency}
          paymentCurrency={selectedCurrency}
          isIncome={isIncome}
        />
      )}
      <PaymentDateField control={control} isIncome={isIncome} />
      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="rpp-notes">Notas</FieldLabel>
            <Textarea
              {...field}
              aria-invalid={fieldState.invalid}
              id="rpp-notes"
              placeholder="Opcional"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}

type PayDialogAlertsProps = {
  payment: RecurringPayment;
  isIncome: boolean;
};

function PayDialogAlerts({ payment, isIncome }: PayDialogAlertsProps) {
  const isForeign = payment.currency !== "PEN";
  const isPayingEarly = payment.nextDueOn > format(new Date(), "yyyy-MM-dd");

  return (
    <>
      {isPayingEarly && (
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>Pago anticipado</AlertTitle>
          <AlertDescription>
            Vencimiento: {formatDate(payment.nextDueOn)}. La fecha de pago se
            pre-llenó con hoy, pero puedes cambiarla.
          </AlertDescription>
        </Alert>
      )}
      {isForeign && (
        <Alert variant="info">
          <InfoIcon />
          <AlertTitle>
            {isIncome ? "Cobro" : "Cargo"} de{" "}
            {formatCurrency(payment.amount, payment.currency)}
          </AlertTitle>
          <AlertDescription>
            Registra el monto en {payment.currency}, o cambia la moneda si el
            banco {isIncome ? "te abonó" : "te cobró"} en otra.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
}

type AccountAmountFieldProps = {
  control: Control<RecurringPaymentPaymentValues>;
  accountName: string;
  accountCurrency: CurrencyCode;
  paymentCurrency: CurrencyCode;
  isIncome: boolean;
};

function AccountAmountField({
  control,
  accountName,
  accountCurrency,
  paymentCurrency,
  isIncome,
}: AccountAmountFieldProps) {
  return (
    <Controller
      control={control}
      name="accountAmount"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="rpp-account-amount">
            Monto {isIncome ? "abonado" : "cobrado"} en {accountCurrency}
          </FieldLabel>
          <NumberInput
            {...field}
            aria-invalid={fieldState.invalid}
            id="rpp-account-amount"
            inputMode="decimal"
            min="0"
            step="0.01"
          />
          <FieldDescription>
            {accountName} está en {accountCurrency}, y este pago es en{" "}
            {paymentCurrency}.
          </FieldDescription>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

type PaymentDateFieldProps = {
  control: Control<RecurringPaymentPaymentValues>;
  isIncome: boolean;
};

function PaymentDateField({ control, isIncome }: PaymentDateFieldProps) {
  return (
    <Controller
      control={control}
      name="occurredOn"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel>
            {isIncome ? "Fecha real de cobro" : "Fecha real de pago"}
          </FieldLabel>
          <Popover>
            <PopoverTrigger
              render={
                <Button
                  aria-invalid={fieldState.invalid}
                  type="button"
                  variant="outline"
                  className="justify-start text-left font-normal"
                />
              }
            >
              <CalendarIcon />
              {field.value ? formatDate(field.value) : "Selecciona una fecha"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={
                  field.value ? new Date(`${field.value}T12:00:00`) : undefined
                }
                onSelect={(date) => {
                  if (date) field.onChange(format(date, "yyyy-MM-dd"));
                }}
              />
            </PopoverContent>
          </Popover>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
