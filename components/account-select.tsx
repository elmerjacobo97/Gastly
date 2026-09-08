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
import { useAccounts } from "@/lib/finance/accounts/hooks/queries"
import { QuickCreateAccountDialog } from "@/components/quick-create-account-dialog"

type AccountSelectProps = {
  value: string
  onChange: (id: string) => void
  "aria-invalid"?: boolean
  id?: string
}

export function AccountSelect({ value, onChange, "aria-invalid": ariaInvalid, id }: AccountSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const { data: accounts = [] } = useAccounts()

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
          <Button type="button" variant="outline" size="icon" onClick={() => onChange("")}>
            <XIcon className="size-4" />
          </Button>
        )}
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
