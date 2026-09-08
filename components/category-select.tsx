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
import { useCategories } from "@/lib/finance/categories/hooks/queries"
import { type TransactionType } from "@/lib/finance/transactions/schemas/transaction-schemas"

type CategorySelectProps = {
  value: string
  onChange: (id: string) => void
  type?: TransactionType
  "aria-invalid"?: boolean
  id?: string
}

export function CategorySelect({
  value,
  onChange,
  type = "expense",
  "aria-invalid": ariaInvalid,
  id,
}: CategorySelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const categoriesQuery = useCategories(type)

  const categories = categoriesQuery.data ?? []

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
              {categories.map((cat) => (
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
          onClick={() => setQuickCreateOpen(true)}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
    </>
  )
}
