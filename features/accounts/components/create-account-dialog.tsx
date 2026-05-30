"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { CheckIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateAccount } from "@/features/accounts/hooks/mutations"
import {
  ACCOUNT_COLORS,
  accountSchema,
  type AccountValues,
} from "@/features/accounts/schemas/account-schemas"
import { cn } from "@/lib/utils"

const EMPTY_DEFAULTS: AccountValues = {
  name: "",
  balance: 0,
  color: "#3b82f6",
  notes: "",
}

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false)

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: EMPTY_DEFAULTS,
  })

  const selectedColor = useWatch({ control: form.control, name: "color" })

  const mutation = useCreateAccount()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">Nueva cuenta</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
          <DialogDescription>
            Registra una cuenta bancaria o de ahorro con su saldo actual.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-account-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit((v) => mutation.mutate(v, {
            onSuccess: () => { form.reset(EMPTY_DEFAULTS); setOpen(false) },
          }))}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ca-name">Nombre</FieldLabel>
                  <Input
                    {...field}
                    id="ca-name"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej. Global66, Interbank, BCP"
                    autoFocus
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
                  <FieldLabel htmlFor="ca-balance">Saldo actual (PEN)</FieldLabel>
                  <NumberInput
                    {...field}
                    id="ca-balance"
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
                  <FieldLabel htmlFor="ca-notes">
                    Notas <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="ca-notes"
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
          <Button disabled={mutation.isPending} form="create-account-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Crear cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
