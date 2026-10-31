"use client";

import {
  type Control,
  type UseFormSetValue,
  Controller,
  useWatch,
} from "react-hook-form";

import { AutocompleteInput } from "@/components/autocomplete-input";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { LoanCurrencyOptions } from "@/features/loans/components/loan-currency-options";
import { type LoanValues } from "@/features/loans/schemas/loan-schemas";
import {
  type Loan,
  LOAN_CURRENCY_LABELS,
} from "@/features/loans/types/loan-types";

type LoanFormFieldsProps = {
  control: Control<LoanValues>;
  setValue: UseFormSetValue<LoanValues>;
  personNames: string[];
  matchingBalance: Loan | undefined;
};

export function LoanFormFields({
  control,
  setValue,
  personNames,
  matchingBalance,
}: LoanFormFieldsProps) {
  const direction = useWatch({ control, name: "direction" });
  const isSale = useWatch({ control, name: "isSale" });

  return (
    <FieldGroup>
      <Controller
        control={control}
        name="direction"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="loan-direction">Tipo</FieldLabel>
            <NativeSelect
              id="loan-direction"
              name={field.name}
              onBlur={field.onBlur}
              onChange={(event) => {
                const kind = event.target.value;
                field.onChange(kind === "sale" ? "lent" : kind);
                setValue("isSale", kind === "sale");
              }}
              ref={field.ref}
              value={isSale ? "sale" : field.value}
            >
              <NativeSelectOption value="lent">Yo presté</NativeSelectOption>
              <NativeSelectOption value="borrowed">
                Me prestaron
              </NativeSelectOption>
              <NativeSelectOption value="sale">
                Vendí a crédito
              </NativeSelectOption>
            </NativeSelect>
            {isSale && (
              <FieldDescription>
                Cada pago que recibas se registrará como ingreso en
                Transacciones (categoría Ventas).
              </FieldDescription>
            )}
          </Field>
        )}
      />

      <Controller
        control={control}
        name="personName"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="loan-person">
              {isSale
                ? "A quién le vendí"
                : direction === "lent"
                  ? "A quién le presté"
                  : "Quién me prestó"}
            </FieldLabel>
            <AutocompleteInput
              id="loan-person"
              aria-invalid={fieldState.invalid}
              name={field.name}
              onBlur={field.onBlur}
              onValueChange={field.onChange}
              placeholder="Ej: Juan García"
              suggestions={personNames}
              value={field.value}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="currency"
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor="loan-currency">Moneda</FieldLabel>
              <NativeSelect {...field} id="loan-currency">
                <LoanCurrencyOptions />
              </NativeSelect>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="amount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="loan-amount">Monto</FieldLabel>
              <NumberInput
                {...field}
                id="loan-amount"
                aria-invalid={fieldState.invalid}
                inputMode="decimal"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>
      {matchingBalance && (
        <FieldDescription>
          Se sumará al saldo en {LOAN_CURRENCY_LABELS[matchingBalance.currency]}{" "}
          de {matchingBalance.personName}.
        </FieldDescription>
      )}

      <Controller
        control={control}
        name="interestRate"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="loan-interest">
              Interés mensual (%){" "}
              <span className="font-normal text-muted-foreground">(opc.)</span>
            </FieldLabel>
            <NumberInput
              {...field}
              id="loan-interest"
              aria-invalid={fieldState.invalid}
              inputMode="decimal"
              max="100"
              min="0"
              placeholder="0"
              step="0.1"
            />
            <FieldDescription>
              Se calcula cada mes sobre el saldo pendiente. 0 = sin interés.
            </FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-3">
        <Controller
          control={control}
          name="loanedOn"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="loan-date">Fecha del préstamo</FieldLabel>
              <DatePicker
                id="loan-date"
                value={field.value}
                onChange={field.onChange}
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={control}
          name="expectedOn"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="loan-expected-on">
                Devolución esperada{" "}
                <span className="font-normal text-muted-foreground">
                  (opc.)
                </span>
              </FieldLabel>
              <DatePicker
                id="loan-expected-on"
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Sin fecha"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="loan-description">
              Motivo{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </FieldLabel>
            <Textarea
              {...field}
              id="loan-description"
              aria-invalid={fieldState.invalid}
              placeholder="Ej: Pollo de pico rico"
              rows={2}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
