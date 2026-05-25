"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ArrowDownIcon, Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { createTransfer } from "@/features/accounts/lib/accounts-api"
import { transferSchema, type TransferValues } from "@/features/accounts/schemas/account-schemas"
import { type Account } from "@/features/accounts/types/account-types"
import { formatCurrency } from "@/lib/format"
import { format } from "date-fns"

type TransferDialogProps = {
  accounts: Account[]
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultFromAccountId?: string
}

export function TransferDialog({ accounts, open, onOpenChange, defaultFromAccountId }: TransferDialogProps) {
  const queryClient = useQueryClient()
  const todayStr = format(new Date(), "yyyy-MM-dd")

  const form = useForm<TransferValues>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: "",
      toAccountId: "",
      fromAmount: 0,
      toAmount: 0,
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
        fromAmount: 0,
        toAmount: 0,
        occurredOn: todayStr,
        notes: "",
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const fromId = useWatch({ control: form.control, name: "fromAccountId" })
  const toId = useWatch({ control: form.control, name: "toAccountId" })
  const fromAmount = useWatch({ control: form.control, name: "fromAmount" })
  const fromAccount = accounts.find((a) => a.id === fromId)
  const toAccount = accounts.find((a) => a.id === toId)
  const isSameCurrency = fromAccount?.currency === toAccount?.currency

  const mutation = useMutation({
    mutationFn: createTransfer,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["accounts"] })
      await queryClient.invalidateQueries({ queryKey: ["account-transfers"] })
      onOpenChange(false)
      toast.success("Transferencia registrada")
    },
    onError: (error) => {
      toast.error("No se pudo registrar la transferencia", { description: error.message })
    },
  })

  function handleSubmit(values: TransferValues) {
    if (fromAccount && Number(values.fromAmount) > fromAccount.balance) {
      form.setError("fromAmount", { type: "manual", message: `Saldo insuficiente. Disponible: ${formatCurrency(fromAccount.balance, fromAccount.currency)}` })
      return
    }
    const toAmount = isSameCurrency ? Number(values.fromAmount) : values.toAmount
    mutation.mutate({ ...values, toAmount })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nueva transferencia</DialogTitle>
          <DialogDescription>
            {isSameCurrency
              ? "Misma moneda — ingresa el monto y la comisión si aplica."
              : "Distinta moneda — ingresa cuánto envías y cuánto llega realmente."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-6 min-h-0">
          <div className="px-6 pb-1">
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
                            {a.name} · {formatCurrency(a.balance, a.currency)}
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
                            {a.name} · {formatCurrency(a.balance, a.currency)}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />

                {/* Misma moneda: monto + comisión opcional */}
                {isSameCurrency ? (
                  <>
                    <Controller
                      control={form.control}
                      name="fromAmount"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="tf-amount">
                            Monto ({fromAccount?.currency})
                          </FieldLabel>
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
                  </>
                ) : (
                  /* Distinta moneda: monto enviado + monto real recibido */
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Controller
                        control={form.control}
                        name="fromAmount"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="tf-from-amount">
                              Envías ({fromAccount?.currency ?? "—"})
                            </FieldLabel>
                            <NumberInput
                              {...field}
                              id="tf-from-amount"
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
                        name="toAmount"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="tf-to-amount">
                              Recibes ({toAccount?.currency ?? "—"})
                            </FieldLabel>
                            <NumberInput
                              {...field}
                              id="tf-to-amount"
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
                    </div>
                    <p className="text-xs text-muted-foreground -mt-2">
                      Ingresa el monto real que llega a {toAccount?.name} después de comisiones y tipo de cambio.
                    </p>
                  </>
                )}

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
                        placeholder="Ej. Cambio a soles vía Global66"
                        rows={2}
                      />
                    </Field>
                  )}
                />
              </FieldGroup>
            </form>
          </div>
        </ScrollArea>
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
