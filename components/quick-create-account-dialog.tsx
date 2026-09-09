"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { Loader2Icon } from "lucide-react"
import { useEffect, useTransition } from "react"
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
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import { createAccount } from "@/features/accounts/server/actions"
import { ACCOUNT_COLORS, accountSchema, type AccountValues } from "@/features/accounts/schemas/account-schemas"

type QuickCreateAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}

export function QuickCreateAccountDialog({ open, onOpenChange, onCreated }: QuickCreateAccountDialogProps) {
  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema) as Resolver<AccountValues>,
    defaultValues: { name: "", balance: 0, color: ACCOUNT_COLORS[0], notes: "" },
  })

  useEffect(() => {
    if (open) form.reset({ name: "", balance: 0, color: ACCOUNT_COLORS[0], notes: "" })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedColor = useWatch({ control: form.control, name: "color" })

  const [isPending, startTransition] = useTransition()

  function onSubmit(values: AccountValues) {
    startTransition(async () => {
      try {
        const id = await createAccount(values)
        toast.success("Cuenta creada")
        onCreated(id)
        onOpenChange(false)
      } catch (error) {
        toast.error("No se pudo crear la cuenta", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Nueva cuenta</DialogTitle>
          <DialogDescription>Se seleccionará automáticamente al crear.</DialogDescription>
        </DialogHeader>
        <form
          id="quick-create-account-form"
          className="flex flex-col gap-4"
          noValidate
          onSubmit={(e) => {
            e.stopPropagation()
            form.handleSubmit(onSubmit)(e)
          }}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="qca-name">Nombre</FieldLabel>
                  <Input {...field} id="qca-name" aria-invalid={fieldState.invalid} placeholder="Ej. BCP, Interbank" autoFocus />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="balance"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="qca-balance">Saldo inicial (PEN)</FieldLabel>
                  <NumberInput {...field} id="qca-balance" inputMode="decimal" min="0" step="0.01" placeholder="0.00" aria-invalid={fieldState.invalid} />
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
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={isPending} form="quick-create-account-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Crear cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
