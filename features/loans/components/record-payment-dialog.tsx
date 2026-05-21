"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2Icon, WalletIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
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
import { Input } from "@/components/ui/input"
import {
  loanPaymentSchema,
  type LoanPaymentValues,
} from "@/features/loans/schemas/loan-schemas"
import { recordLoanPayment } from "@/features/loans/lib/loans-api"
import { type Loan } from "@/features/loans/types/loan-types"
import { formatCurrency } from "@/lib/format"

type RecordPaymentDialogProps = {
  loan: Loan
}

export function RecordPaymentDialog({ loan }: RecordPaymentDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<LoanPaymentValues>({
    resolver: zodResolver(loanPaymentSchema),
    defaultValues: {
      amount: loan.pendingAmount,
      occurredOn: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        amount: loan.pendingAmount,
        occurredOn: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      })
    }
  }, [open, loan.pendingAmount]) // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: LoanPaymentValues) => recordLoanPayment(loan.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] })
      setOpen(false)
      toast.success("Abono registrado")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el abono", { description: error.message })
    },
  })

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
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="lp-amount">Monto abonado</FieldLabel>
                    <Input
                      {...field}
                      id="lp-amount"
                      aria-invalid={fieldState.invalid}
                      type="number"
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
          <Button disabled={mutation.isPending} form="loan-payment-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Confirmar abono
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
