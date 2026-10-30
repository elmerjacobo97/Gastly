"use client";

import { PlusIcon } from "lucide-react";

import { CategoryCombobox } from "@/components/category-combobox";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { type Category } from "@/lib/category-types";

type TransactionCategoryFieldProps = {
  categories: Category[];
  value: string;
  invalid: boolean;
  error?: { message?: string };
  onChange: (value: string) => void;
  onCreate: () => void;
};

export function TransactionCategoryField({
  categories,
  value,
  invalid,
  error,
  onChange,
  onCreate,
}: TransactionCategoryFieldProps) {
  return (
    <Field data-invalid={invalid}>
      <FieldLabel>Categoría</FieldLabel>
      <div className="flex gap-2">
        <CategoryCombobox
          categories={categories}
          value={value}
          onChange={onChange}
          valueKey="name"
          aria-invalid={invalid}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Crear categoría"
          onClick={onCreate}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
      {invalid && <FieldError errors={error ? [error] : []} />}
    </Field>
  );
}
