"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { CheckIcon, Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
import { useUpdateAccount } from "@/lib/finance/accounts/hooks/mutations"
import {
  ACCOUNT_COLORS,
  accountSchema,
  type AccountValues,
} from "@/lib/finance/accounts/schemas/account-schemas"
import { type Account } from "@/lib/finance/accounts/types/account-types"
import { cn } from "@/lib/utils"

type EditAccountDialogProps = {
  account: Account
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildValues(account: Account): AccountValues {
  return {
    name: account.name,
    balance: account.balance,
    color: account.color,
    notes: account.notes ?? "",
  }
}

export function EditAccountDialog({ account, open, onOpenChange }: EditAccountDialogProps) {
  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema) as Resolver<AccountValues>,
    defaultValues: buildValues(account),
  })

  useEffect(() => {
    if (open) form.reset(buildValues(account))
  }, [open, account.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedColor = useWatch({ control: form.control, name: "color" })

  const mutation = useUpdateAccount(account.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cuenta</DialogTitle>
          <DialogDescription>
            Modifica los datos de tu cuenta. Actualiza el saldo si cambió.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-account-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit((v) => mutation.mutate(v, { onSuccess: () => onOpenChange(false) }))}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ea-name">Nombre</FieldLabel>
                  <Input
                    {...field}
                    id="ea-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej. Global66, Interbank, BCP"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="balance"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ea-balance">Saldo actual (PEN)</FieldLabel>
                  <NumberInput
                    {...field}
                    id="ea-balance"
                    aria-invalid={fieldState.invalid}
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                    {ACCOUNT_COLORS.map((c) => (
                      <Button
                        key={c}
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => field.onChange(c)}
                        className={cn(
                          "rounded-full hover:bg-transparent hover:scale-110",
                          selectedColor === c && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={c}
                      >
                        {selectedColor === c && (
                          <CheckIcon className="size-3.5 text-white drop-shadow-sm" />
                        )}
                      </Button>
                    ))}
                  </div>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="ea-notes">
                    Notas <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="ea-notes"
                    placeholder="Ej. Cuenta corriente BCP, solo para gastos"
                    rows={2}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={mutation.isPending} form="edit-account-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
