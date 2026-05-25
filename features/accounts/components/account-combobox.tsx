"use client"

import { useQuery } from "@tanstack/react-query"
import { CheckIcon, ChevronsUpDownIcon, PlusIcon, XIcon } from "lucide-react"
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
import { getAccounts } from "@/features/accounts/lib/accounts-api"
import { QuickCreateAccountDialog } from "@/features/accounts/components/quick-create-account-dialog"
import { cn } from "@/lib/utils"

type AccountComboboxProps = {
  value: string
  onChange: (id: string) => void
  "aria-invalid"?: boolean
  id?: string
}

export function AccountCombobox({ value, onChange, "aria-invalid": ariaInvalid, id }: AccountComboboxProps) {
  const [open, setOpen] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts"],
    queryFn: getAccounts,
  })

  const spendable = accounts.filter((a) => !a.isSavings)
  const selected = spendable.find((a) => a.id === value)

  return (
    <>
      <QuickCreateAccountDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
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
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: selected.color }}
                />
                <span className="truncate">{selected.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{selected.currency}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">Sin cuenta vinculada</span>
            )}
            <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar cuenta..." />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              {spendable.length > 0 && (
                <CommandGroup>
                  {value && (
                    <CommandItem
                      value="__clear__"
                      onSelect={() => {
                        onChange("")
                        setOpen(false)
                      }}
                    >
                      <XIcon className="size-4 shrink-0 opacity-50" />
                      Sin cuenta vinculada
                    </CommandItem>
                  )}
                  {spendable.map((a) => (
                    <CommandItem
                      key={a.id}
                      value={a.name}
                      onSelect={() => {
                        onChange(a.id)
                        setOpen(false)
                      }}
                    >
                      <CheckIcon
                        className={cn("size-4 shrink-0", value === a.id ? "opacity-100" : "opacity-0")}
                      />
                      <span
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: a.color }}
                      />
                      <span className="flex-1 truncate">{a.name}</span>
                      <span className="text-xs text-muted-foreground">{a.currency}</span>
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
                  Nueva cuenta
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
