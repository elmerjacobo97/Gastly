"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { ArrowDownIcon, Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { type Resolver, Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
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
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { NumberInput } from "@/components/ui/number-input"
import { Textarea } from "@/components/ui/textarea"
import { useCreateTransfer } from "@/lib/finance/accounts/hooks/mutations"
import { transferSchema, type TransferValues } from "@/lib/finance/accounts/schemas/account-schemas"
import { type Account } from "@/lib/finance/accounts/types/account-types"
import { formatCurrency } from "@/lib/format"
import { format } from "date-fns"

type TransferDialogProps = {
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultFromAccountId?: string
}

export function TransferDialog({ accounts, open, onOpenChange, defaultFromAccountId }: TransferDialogProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema) as Resolver<TransferValues>,
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      amount: 0,
      occurredOn: todayStr,
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      const firstOther = accounts.find((a) => a.id !== defaultFromAccountId)
      form.reset({
        fromAccountId: defaultFromAccountId ?? accounts[0]?.id ?? "",
        toAccountId: firstOther?.id ?? accounts[1]?.id ?? "",
        amount: 0,
        occurredOn: todayStr,
        notes: "",
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const fromId = form.watch("fromAccountId")
  const fromAccount = accounts.find((a) => a.id === fromId)

  const mutation = useCreateTransfer()

  function handleSubmit(values: TransferValues) {
    if (fromAccount && Number(values.amount) > fromAccount.balance) {
      form.setError("amount", { type: "manual", message: `Saldo insuficiente. Disponible: ${formatCurrency(fromAccount.balance)}` })
      return
    }
    mutation.mutate(values, { onSuccess: () => onOpenChange(false) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva transferencia</DialogTitle>
          <DialogDescription>
            Ingresa el monto a transferir entre tus cuentas en PEN.
          </DialogDescription>
        </DialogHeader>
        <form
          id="transfer-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(handleSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="fromAccountId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tf-from">Cuenta origen</FieldLabel>
                  <NativeSelect {...field} id="tf-from" className="w-full">
                    <NativeSelectOption value="">Selecciona cuenta</NativeSelectOption>
                    {accounts.map((a) => (
                      <NativeSelectOption key={a.id} value={a.id}>
                        {a.name} · {formatCurrency(a.balance)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="flex justify-center">
              <div className="flex size-8 items-center justify-center rounded-full border bg-muted">
                <ArrowDownIcon className="size-4 text-muted-foreground" />
              </div>
            </div>

            <Controller
              control={form.control}
              name="toAccountId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tf-to">Cuenta destino</FieldLabel>
                  <NativeSelect {...field} id="tf-to" className="w-full">
                    <NativeSelectOption value="">Selecciona cuenta</NativeSelectOption>
                    {accounts.map((a) => (
                      <NativeSelectOption key={a.id} value={a.id}>
                        {a.name} · {formatCurrency(a.balance)}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="tf-amount">Monto (PEN)</FieldLabel>
                  <NumberInput
                    {...field}
                    id="tf-amount"
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
              name="occurredOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Fecha</FieldLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="tf-notes">
                    Notas <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="tf-notes"
                    placeholder="Ej. Para gastos del mes"
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
          <Button disabled={mutation.isPending} form="transfer-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Registrar transferencia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
