"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { CategoryCombobox } from "@/components/category-combobox";
import { QuickCreateCategoryDialog } from "@/components/quick-create-category-dialog";
import { type Category } from "@/lib/category-types";
import { type TransactionType } from "@/lib/transaction-types";

type CategorySelectProps = {
  categories: Category[];
  value: string;
  onChange: (id: string) => void;
  type?: TransactionType;
  "aria-invalid"?: boolean;
  id?: string;
};

export function CategorySelect({
  categories,
  value,
  onChange,
  type = "expense",
  "aria-invalid": ariaInvalid,
  id,
}: CategorySelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const filtered = type
    ? categories.filter((c) => c.type === type)
    : categories;

  const selectedDescription = filtered.find((c) => c.id === value)?.description;

  return (
    <>
      <QuickCreateCategoryDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        defaultType={type}
        onCreated={(id) => onChange(id)}
      />
      <div className="flex gap-2">
        <CategoryCombobox
          categories={filtered}
          value={value}
          onChange={onChange}
          id={id}
          aria-invalid={ariaInvalid}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Crear categoría"
          onClick={() => setQuickCreateOpen(true)}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
      {selectedDescription && (
        <p className="text-xs text-muted-foreground">{selectedDescription}</p>
      )}
    </>
  );
}
