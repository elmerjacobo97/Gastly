"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { CheckIcon, Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { createAccount } from "@/features/accounts/lib/accounts-api"
import { ACCOUNT_COLORS, ACCOUNT_CURRENCIES, accountSchema, type AccountValues } from "@/features/accounts/schemas/account-schemas"
import { cn } from "@/lib/utils"

type QuickCreateAccountDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (id: string) => void
}

export function QuickCreateAccountDialog({ open, onOpenChange, onCreated }: QuickCreateAccountDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<AccountValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", currency: "PEN", balance: 0, isSavings: false, color: ACCOUNT_COLORS[0], notes: "" },
  })

  useEffect(() => {
    if (open) form.reset({ name: "", currency: "PEN", balance: 0, isSavings: false, color: ACCOUNT_COLORS[0], notes: "" })
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedColor = form.watch("color")

  const mutation = useMutation({
    mutationFn: createAccount,
    onSuccess: async (account) => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
      onCreated(account.id)
      onOpenChange(false)
      toast.success("Cuenta creada")
    },
    onError: (error) => {
      toast.error("No se pudo crear la cuenta", { description: error.message })
    },
  })

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
            form.handleSubmit((v) => mutation.mutate(v))(e)
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
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="currency"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="qca-currency">Moneda</FieldLabel>
                    <NativeSelect {...field} id="qca-currency">
                      {ACCOUNT_CURRENCIES.map((c) => (
                        <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                      ))}
                    </NativeSelect>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="balance"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="qca-balance">Saldo inicial</FieldLabel>
                    <NumberInput {...field} id="qca-balance" inputMode="decimal" min="0" step="0.01" placeholder="0.00" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <div className="flex flex-wrap gap-2 rounded-lg border p-3">
                    {ACCOUNT_COLORS.map((hex) => (
                      <Button
                        key={hex}
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => field.onChange(hex)}
                        className={cn(
                          "rounded-full hover:bg-transparent hover:scale-110",
                          selectedColor === hex && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                        )}
                        style={{ backgroundColor: hex }}
                      >
                        {selectedColor === hex && <CheckIcon className="size-3.5 text-white drop-shadow-sm" />}
                      </Button>
                    ))}
                  </div>
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={mutation.isPending} form="quick-create-account-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Crear cuenta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
