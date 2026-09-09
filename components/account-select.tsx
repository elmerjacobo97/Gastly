"use client"

import { PlusIcon, XIcon } from "lucide-react"
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
import { type Account } from "@/features/accounts/types/account-types"
import { QuickCreateAccountDialog } from "@/components/quick-create-account-dialog"

type AccountSelectProps = {
  accounts: Account[]
  value: string
  onChange: (id: string) => void
  "aria-invalid"?: boolean
  id?: string
}

export function AccountSelect({
  accounts,
  value,
  onChange,
  "aria-invalid": ariaInvalid,
  id,
}: AccountSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  return (
    <>
      <QuickCreateAccountDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        onCreated={(id) => onChange(id)}
      />
      <div className="flex gap-2">
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger id={id} aria-invalid={ariaInvalid} className="flex-1">
            <SelectValue placeholder="Sin cuenta vinculada" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.color }} />
                  {a.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Quitar cuenta"
            onClick={() => onChange("")}
          >
            <XIcon className="size-4" />
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Crear cuenta"
          onClick={() => setQuickCreateOpen(true)}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
    </>
  )
}
