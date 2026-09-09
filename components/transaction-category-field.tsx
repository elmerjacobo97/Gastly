"use client"

import { PlusIcon } from "lucide-react"

import { CategoryIconBadge } from "@/components/category-icon-badge"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { type Category } from "@/features/categories/types/category-types"

type TransactionCategoryFieldProps = {
  categories: Category[]
  value: string
  invalid: boolean
  error?: { message?: string }
  onChange: (value: string) => void
  onCreate: () => void
}

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
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger aria-invalid={invalid} className="flex-1">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.name}>
                  <CategoryIconBadge
                    icon={category.icon}
                    color={category.color}
                    className="size-5 rounded-md"
                  />
                  {category.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
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
  )
}
