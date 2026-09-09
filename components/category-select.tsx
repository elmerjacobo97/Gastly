"use client"

import { PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CategoryIconBadge } from "@/components/category-icon-badge"
import { QuickCreateCategoryDialog } from "@/components/quick-create-category-dialog"
import { type Category } from "@/features/categories/types/category-types"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"

type CategorySelectProps = {
  categories: Category[]
  value: string
  onChange: (id: string) => void
  type?: TransactionType
  "aria-invalid"?: boolean
  id?: string
}

export function CategorySelect({
  categories,
  value,
  onChange,
  type = "expense",
  "aria-invalid": ariaInvalid,
  id,
}: CategorySelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const filtered = type ? categories.filter((c) => c.type === type) : categories

  return (
    <>
      <QuickCreateCategoryDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        defaultType={type}
        onCreated={(id) => onChange(id)}
      />
      <div className="flex gap-2">
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger id={id} aria-invalid={ariaInvalid} className="flex-1">
            <SelectValue placeholder="Selecciona una categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {filtered.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  <CategoryIconBadge icon={cat.icon} color={cat.color} className="size-5 rounded" />
                  {cat.name}
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
          onClick={() => setQuickCreateOpen(true)}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
    </>
  )
}
