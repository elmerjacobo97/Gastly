"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Loader2Icon, WalletCardsIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"

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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { DatePicker } from "@/components/ui/date-picker"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CategoryIconBadge } from "@/components/category-icon-badge"
import {
  payInstallmentsSchema,
  type PayInstallmentsValues,
} from "@/lib/finance/installments/schemas/installment-schemas"
import { usePayMonthInstallments } from "@/lib/finance/installments/hooks/mutations"
import {
  type InstallmentPayment,
  type InstallmentPurchase,
} from "@/lib/finance/installments/types/installment-types"
import { formatCurrency } from "@/lib/format"

type PendingItem = { payment: InstallmentPayment; purchase: InstallmentPurchase }

type PayInstallmentsDialogProps = {
  pending: PendingItem[]
  month: Date
}

function getDefaultPaymentDate(month: Date): string {
  const d = new Date(month.getFullYear(), month.getMonth(), 20)
  return format(d, "yyyy-MM-dd")
}

export function PayInstallmentsDialog({ pending, month }: PayInstallmentsDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<PayInstallmentsValues>({
    resolver: zodResolver(payInstallmentsSchema),
    defaultValues: { occurredOn: getDefaultPaymentDate(month) },
  })

  const monthLabel = format(month, "MMMM yyyy", { locale: es })
  const total = pending.reduce((s, { payment }) => s + payment.amount, 0)

  const mutation = usePayMonthInstallments(pending)

  if (pending.length === 0) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <WalletCardsIcon data-icon="inline-start" />
          Registrar pago del 20 de {format(month, "MMMM", { locale: es })}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="capitalize">Pago de tarjeta · {monthLabel}</DialogTitle>
          <DialogDescription>
            Se registrarán {pending.length} cuota{pending.length !== 1 ? "s" : ""} como gasto en transacciones.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <div className="flex flex-col divide-y rounded-lg border">
              {pending.map(({ payment, purchase }) => (
                <div key={payment.id} className="flex items-center gap-3 px-3 py-2.5">
                  {purchase.category && (
                    <CategoryIconBadge
                      icon={purchase.category.icon}
                      color={purchase.category.color}
                      className="size-8 shrink-0 rounded-lg"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{purchase.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Cuota {payment.paymentNumber}/{purchase.totalInstallments}
                    </p>
                  </div>
                  <span className="text-sm font-medium tabular-nums shrink-0">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2.5 font-semibold">
                <span className="text-sm">Total</span>
                <span className="tabular-nums">{formatCurrency(total)}</span>
              </div>
            </div>

            <form
              id="pay-installments-form"
              className="mt-5"
              noValidate
              onSubmit={form.handleSubmit((v) => mutation.mutate(v, {
                onSuccess: () => { form.reset({ occurredOn: getDefaultPaymentDate(month) }); setOpen(false) },
              }))}
            >
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="occurredOn"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="pay-date">Fecha de pago</FieldLabel>
                      <DatePicker
                        id="pay-date"
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
          <Button disabled={mutation.isPending} form="pay-installments-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
