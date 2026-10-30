"use client";

import { ChevronsUpDownIcon } from "lucide-react";
import { useState } from "react";

import { CategoryIconBadge } from "@/components/category-icon-badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { type Category } from "@/lib/category-types";

type CategoryComboboxProps = {
  categories: Category[];
  value: string;
  onChange: (value: string) => void;
  // Which category field identifies the selection: forms store the id or the name.
  valueKey?: "id" | "name";
  disabled?: boolean;
  "aria-invalid"?: boolean;
  id?: string;
};

export function CategoryCombobox({
  categories,
  value,
  onChange,
  valueKey = "id",
  disabled,
  "aria-invalid": ariaInvalid,
  id,
}: CategoryComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((category) => category[valueKey] === value);

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-invalid={ariaInvalid}
          disabled={disabled}
          className="min-w-0 flex-1 justify-between font-normal"
        >
          {selected ? (
            <span className="flex min-w-0 items-center gap-2">
              <CategoryIconBadge
                icon={selected.icon}
                color={selected.color}
                className="size-5 rounded-md"
              />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Selecciona una categoría
            </span>
          )}
          <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--radix-popover-trigger-width) p-0"
      >
        <Command>
          <CommandInput placeholder="Buscar categoría..." />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={category.name}
                  keywords={[category.description]}
                  data-checked={category[valueKey] === value}
                  onSelect={() => {
                    onChange(category[valueKey]);
                    setOpen(false);
                  }}
                >
                  <CategoryIconBadge
                    icon={category.icon}
                    color={category.color}
                    className="size-5 rounded-md"
                  />
                  <span className="flex min-w-0 flex-col">
                    {category.name}
                    {category.description && (
                      <span className="line-clamp-2 text-xs text-muted-foreground">
                        {category.description}
                      </span>
                    )}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
