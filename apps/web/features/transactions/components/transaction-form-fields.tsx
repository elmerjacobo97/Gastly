"use client";

import { type Control, Controller, useWatch } from "react-hook-form";

import { CurrencyField } from "@/components/currency-field";
import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { type TransactionValues } from "@/features/transactions/schemas/transaction-schemas";

type TransactionFieldProps = {
  control: Control<TransactionValues>;
  idPrefix: string;
};

export function TransactionAmountFields({
  control,
  idPrefix,
  lockType,
}: TransactionFieldProps & { lockType: boolean }) {
  const currency = useWatch({ control, name: "currency" });

  return (
    <>
      <Controller
        control={control}
        name="type"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-type`}>Tipo</FieldLabel>
            <NativeSelect
              {...field}
              aria-invalid={fieldState.invalid}
              className="w-full"
              disabled={lockType}
              id={`${idPrefix}-type`}
            >
              <NativeSelectOption value="expense">Gasto</NativeSelectOption>
              <NativeSelectOption value="income">Ingreso</NativeSelectOption>
            </NativeSelect>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="currency"
        render={({ field, fieldState }) => (
          <CurrencyField
            id={`${idPrefix}-currency`}
            value={field.value}
            onChange={field.onChange}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-amount`}>
              Monto ({currency})
            </FieldLabel>
            <NumberInput
              {...field}
              aria-invalid={fieldState.invalid}
              id={`${idPrefix}-amount`}
              inputMode="decimal"
              min="0"
              placeholder="0.00"
              step="0.01"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </>
  );
}

export function TransactionDateField({
  control,
  idPrefix,
}: TransactionFieldProps) {
  return (
    <Controller
      control={control}
      name="occurredOn"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={`${idPrefix}-date`}>Fecha</FieldLabel>
          <DatePicker
            id={`${idPrefix}-date`}
            value={field.value}
            onChange={field.onChange}
            aria-invalid={fieldState.invalid}
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export function TransactionNotesField({
  control,
  idPrefix,
}: TransactionFieldProps) {
  return (
    <Controller
      control={control}
      name="notes"
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-notes`}>
            Notas <span className="text-muted-foreground">(opcional)</span>
          </FieldLabel>
          <Textarea
            {...field}
            id={`${idPrefix}-notes`}
            placeholder="Detalle adicional"
            rows={2}
          />
        </Field>
      )}
    />
  );
}
