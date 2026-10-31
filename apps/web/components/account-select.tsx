"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { AccountCombobox } from "@/components/account-combobox";
import { type Account } from "@/lib/account-types";
import { QuickCreateAccountDialog } from "@/components/quick-create-account-dialog";

type AccountSelectProps = {
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  "aria-invalid"?: boolean;
  id?: string;
};

export function AccountSelect({
  accounts,
  value,
  onChange,
  "aria-invalid": ariaInvalid,
  id,
}: AccountSelectProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  return (
    <>
      <QuickCreateAccountDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        onCreated={(id) => onChange(id)}
      />
      <div className="flex gap-2">
        <AccountCombobox
          accounts={accounts}
          value={value}
          onChange={onChange}
          aria-invalid={ariaInvalid}
          id={id}
        />
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
  );
}
