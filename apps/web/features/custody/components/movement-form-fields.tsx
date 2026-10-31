"use client";

import { type Control, Controller } from "react-hook-form";

import { DatePicker } from "@/components/ui/date-picker";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { METHOD_LABELS } from "@/features/custody/lib/method-labels";
import { type CustodyMovementValues } from "@/features/custody/schemas/custody-schemas";
import { type CustodyMovementType } from "@/features/custody/types/custody-types";

type MovementFieldProps = { control: Control<CustodyMovementValues> };

export function MovementAmountDateFields({ control }: MovementFieldProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Controller
        control={control}
        name="amount"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="cm-amount">Monto</FieldLabel>
            <NumberInput
              {...field}
              id="cm-amount"
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

      <Controller
        control={control}
        name="occurredOn"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="cm-date">Fecha</FieldLabel>
            <DatePicker
              id="cm-date"
              value={field.value}
              onChange={field.onChange}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  );
}

export function MovementMethodField({ control }: MovementFieldProps) {
  return (
    <Controller
      control={control}
      name="method"
      render={({ field }) => (
        <Field>
          <FieldLabel htmlFor="cm-method">Método</FieldLabel>
          <NativeSelect {...field} id="cm-method" value={field.value ?? "yape"}>
            {Object.entries(METHOD_LABELS).map(([value, label]) => (
              <NativeSelectOption key={value} value={value}>
                {label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
      )}
    />
  );
}

export function MovementNotesField({
  control,
  type,
}: MovementFieldProps & { type: CustodyMovementType }) {
  return (
    <Controller
      control={control}
      name="notes"
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="cm-notes">
            Notas{" "}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </FieldLabel>
          <Input
            {...field}
            id="cm-notes"
            aria-invalid={fieldState.invalid}
            placeholder={
              type === "deposit"
                ? "Ej: Operación YAPE #123"
                : "Ej: Compra en tienda X"
            }
          />
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}
