"use client";

import { type Control, Controller, useWatch } from "react-hook-form";

import { AccountSelect } from "@/components/account-select";
import { CategorySelect } from "@/components/category-select";
import { CurrencyOptions } from "@/components/currency-options";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import { type RecurringPaymentValues } from "@/features/recurring-payments/schemas/recurring-payment-schemas";
import { type Account } from "@/lib/account-types";
import { type Category } from "@/lib/category-types";

type RecurringPaymentFormFieldsProps = {
  control: Control<RecurringPaymentValues>;
  accounts: Account[];
  categories: Category[];
  idPrefix: string;
};

export function RecurringPaymentFormFields({
  control,
  accounts,
  categories,
  idPrefix,
}: RecurringPaymentFormFieldsProps) {
  const frequency = useWatch({ control, name: "frequency" });
  const currency = useWatch({ control, name: "currency" });
  const type = useWatch({ control, name: "type" });

  return (
    <FieldGroup>
      <Controller
        control={control}
        name="type"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-type`}>Tipo</FieldLabel>
            <NativeSelect
              {...field}
              aria-invalid={fieldState.invalid}
              id={`${idPrefix}-type`}
            >
              <NativeSelectOption value="expense">
                Gasto recurrente
              </NativeSelectOption>
              <NativeSelectOption value="income">
                Ingreso recurrente
              </NativeSelectOption>
            </NativeSelect>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="description"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-description`}>Nombre</FieldLabel>
            <Input
              {...field}
              aria-invalid={fieldState.invalid}
              id={`${idPrefix}-description`}
              placeholder={
                type === "income"
                  ? "Sueldo, Freelance"
                  : "Disney+, Luz, Claude Code"
              }
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="currency"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-currency`}>Moneda</FieldLabel>
            <NativeSelect
              {...field}
              aria-invalid={fieldState.invalid}
              id={`${idPrefix}-currency`}
            >
              <CurrencyOptions />
            </NativeSelect>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-amount`}>
              Monto estimado ({currency})
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
      <Controller
        control={control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-category`}>Categoría</FieldLabel>
            <CategorySelect
              categories={categories}
              id={`${idPrefix}-category`}
              value={field.value}
              onChange={field.onChange}
              type={type === "income" ? "income" : "expense"}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="frequency"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${idPrefix}-frequency`}>
                Frecuencia
              </FieldLabel>
              <NativeSelect
                {...field}
                aria-invalid={fieldState.invalid}
                id={`${idPrefix}-frequency`}
              >
                <NativeSelectOption value="monthly">Mensual</NativeSelectOption>
                <NativeSelectOption value="custom_months">
                  Cada X meses
                </NativeSelectOption>
                <NativeSelectOption value="yearly">Anual</NativeSelectOption>
              </NativeSelect>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {frequency === "custom_months" ? (
          <Controller
            control={control}
            name="intervalMonths"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${idPrefix}-interval`}>
                  Intervalo
                </FieldLabel>
                <div className="relative">
                  <NumberInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`${idPrefix}-interval`}
                    inputMode="numeric"
                    min="1"
                    max="120"
                    className="w-full pr-16"
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                    meses
                  </span>
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ) : (
          <Field>
            <FieldLabel>Intervalo</FieldLabel>
            <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
              {frequency === "yearly" ? "Cada 12 meses" : "Cada 1 mes"}
            </div>
          </Field>
        )}
      </div>
      <Controller
        control={control}
        name="paymentKind"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-kind`}>Tipo de monto</FieldLabel>
            <NativeSelect
              {...field}
              aria-invalid={fieldState.invalid}
              id={`${idPrefix}-kind`}
            >
              <NativeSelectOption value="fixed">Fijo</NativeSelectOption>
              <NativeSelectOption value="variable">Variable</NativeSelectOption>
            </NativeSelect>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      <Controller
        control={control}
        name="nextDueOn"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel>
              {type === "income"
                ? "Próxima fecha de cobro"
                : "Próxima fecha de pago"}
            </FieldLabel>
            <DatePicker
              id={`${idPrefix}-next-due`}
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
        name="accountId"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor={`${idPrefix}-account`}>
              Cuenta{" "}
              <span className="font-normal text-muted-foreground">
                (opcional)
              </span>
            </FieldLabel>
            <AccountSelect
              accounts={accounts}
              id={`${idPrefix}-account`}
              value={field.value ?? ""}
              onChange={field.onChange}
            />
          </Field>
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-notes`}>Notas</FieldLabel>
            <Textarea
              {...field}
              aria-invalid={fieldState.invalid}
              id={`${idPrefix}-notes`}
              placeholder="Opcional"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
