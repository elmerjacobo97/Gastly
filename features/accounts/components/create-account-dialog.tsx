"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { Loader2Icon, PlusIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form"

import { ColorPicker } from "@/components/color-picker"
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
import { createAccount } from "@/features/accounts/server/actions"
import {
  ACCOUNT_COLORS,
  accountSchema,
  type AccountValues,
} from "@/features/accounts/schemas/account-schemas"

const EMPTY_DEFAULTS: AccountValues = {
  name: "",
  balance: 0,
  color: "#3b82f6",
  notes: "",
}

export function CreateAccountDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema) as Resolver<AccountValues>,
    defaultValues: EMPTY_DEFAULTS,
  })

  const selectedColor = useWatch({ control: form.control, name: "color" })

  function onSubmit(values: AccountValues) {
    startTransition(async () => {
      try {
        await createAccount(values)
        toast.success("Cuenta creada")
        form.reset(EMPTY_DEFAULTS)
        setOpen(false)
      } catch (error) {
        toast.error("No se pudo crear la cuenta", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

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
          onSubmit={form.handleSubmit(onSubmit)}
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
                  <ColorPicker
                    options={ACCOUNT_COLORS}
                    value={selectedColor}
                    onChange={field.onChange}
                  />
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
          <Button disabled={isPending} form="create-account-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Crear cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
