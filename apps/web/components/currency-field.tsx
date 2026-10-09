"use client";

import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
import { CurrencyOptions } from "@/components/currency-options";
import { type CurrencyCode } from "@/lib/format";

type CurrencyFieldProps = {
  id: string;
  value: CurrencyCode;
  onChange: (value: CurrencyCode) => void;
  error?: string;
};

export function CurrencyField({
  id,
  value,
  onChange,
  error,
}: CurrencyFieldProps) {
  return (
    <Field data-invalid={Boolean(error)}>
      <FieldLabel htmlFor={id}>Moneda</FieldLabel>
      <NativeSelect
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.currentTarget.value as CurrencyCode)
        }
        aria-invalid={Boolean(error)}
        className="w-full"
      >
        <CurrencyOptions />
      </NativeSelect>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </Field>
  );
}
