"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { format } from "date-fns"
import { Loader2Icon, WalletIcon } from "lucide-react"
import { useState } from "react"
import { type Resolver, Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
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
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import {
  loanPaymentSchema,
  type LoanPaymentValues,
} from "@/lib/finance/loans/schemas/loan-schemas"
import { useRecordLoanPayment } from "@/lib/finance/loans/hooks/mutations"
import { type Loan } from "@/lib/finance/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

type RecordPaymentDialogProps = {
  loan: Loan
}

export function RecordPaymentDialog({ loan }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<LoanPaymentValues>({
    resolver: zodResolver(loanPaymentSchema) as Resolver<LoanPaymentValues>,
    defaultValues: {
      amount: loan.pendingAmount,
      occurredOn: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  })

  const mutation = useRecordLoanPayment(loan.id)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <WalletIcon data-icon="inline-start" />
          Registrar abono
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Abono de {loan.personName}</DialogTitle>
          <DialogDescription>
            Pendiente: {formatCurrency(loan.pendingAmount)}
          </DialogDescription>
        </DialogHeader>
        <form
          id="loan-payment-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit((v) => mutation.mutate(v, {
            onSuccess: () => { form.reset({ amount: loan.pendingAmount, occurredOn: format(new Date(), "yyyy-MM-dd"), notes: "" }); setOpen(false) },
          }))}
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lp-amount">Monto abonado</FieldLabel>
                    <NumberInput
                      {...field}
                      id="lp-amount"
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
                    <FieldLabel htmlFor="lp-date">Fecha</FieldLabel>
                    <DatePicker
                      id="lp-date"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="lp-notes">
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="lp-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Transferencia BCP"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={mutation.isPending} form="loan-payment-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Confirmar abono
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
