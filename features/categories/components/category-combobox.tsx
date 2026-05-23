"use client"

import { useQuery } from "@tanstack/react-query"
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { QuickCreateCategoryDialog } from "@/features/categories/components/quick-create-category-dialog"
import { getCategories } from "@/features/categories/lib/categories-api"
import { type TransactionType } from "@/features/transactions/schemas/transaction-schemas"
import { cn } from "@/lib/utils"

type CategoryComboboxProps = {
  value: string
  onChange: (id: string) => void
  type?: TransactionType
  "aria-invalid"?: boolean
  id?: string
}

export function CategoryCombobox({
  value,
  onChange,
  type = "expense",
  "aria-invalid": ariaInvalid,
  id,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const categoriesQuery = useQuery({
    queryKey: ["categories", type],
    queryFn: () => getCategories(type),
  })

  const categories = categoriesQuery.data ?? []
  const selected = categories.find((c) => c.id === value)

  return (
    <>
      <QuickCreateCategoryDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        defaultType={type}
        onCreated={(id) => onChange(id)}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-invalid={ariaInvalid}
            className="w-full justify-between font-normal"
          >
            {selected ? (
              <span className="flex items-center gap-2 truncate">
                <CategoryIconBadge icon={selected.icon} color={selected.color} className="size-5 shrink-0 rounded" />
                <span className="truncate">{selected.name}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Selecciona una categoría</span>
            )}
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar categoría..." />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              {categories.length > 0 && (
                <CommandGroup>
                  {categories.map((cat) => (
                    <CommandItem
                      key={cat.id}
                      value={cat.name}
                      onSelect={() => {
                        onChange(cat.id)
                        setOpen(false)
                      }}
                    >
                      <CheckIcon
                        className={cn("size-4 shrink-0", value === cat.id ? "opacity-100" : "opacity-0")}
                      />
                      <CategoryIconBadge icon={cat.icon} color={cat.color} className="size-6 shrink-0 rounded" />
                      {cat.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="__quick_create__"
                  onSelect={() => {
                    setOpen(false)
                    setQuickCreateOpen(true)
                  }}
                >
                  <PlusIcon className="mr-2 size-4" />
                  Nueva categoría con ícono y color
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
