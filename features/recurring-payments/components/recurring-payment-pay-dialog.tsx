"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { CalendarIcon, InfoIcon, Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { type Resolver, Controller, useForm } from "react-hook-form"

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { NumberInput } from "@/components/ui/number-input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  recurringPaymentPaymentSchema,
  type RecurringPaymentPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas"
import { type RecurringPayment } from "@/features/recurring-payments/types/recurring-payment-types"
import { formatDate } from "@/lib/format"

type RecurringPaymentPayDialogProps = {
  payment: RecurringPayment | null
  open: boolean
  pending: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RecurringPaymentPaymentValues) => void
}

export function RecurringPaymentPayDialog({
  payment,
  open,
  pending,
  onOpenChange,
  onSubmit,
}: RecurringPaymentPayDialogProps) {
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const isPayingEarly = !!payment && payment.nextDueOn > todayStr

  const form = useForm<RecurringPaymentPaymentValues>({
    resolver: zodResolver(recurringPaymentPaymentSchema) as Resolver<RecurringPaymentPaymentValues>,
    defaultValues: {
      amount: payment?.amount ?? 0,
      occurredOn: isPayingEarly ? todayStr : (payment?.nextDueOn ?? todayStr),
      notes: payment?.notes ?? "",
    },
  })

  useEffect(() => {
    if (open && payment) {
      const today = format(new Date(), "yyyy-MM-dd")
      form.reset({
        amount: payment.amount,
        occurredOn: payment.nextDueOn > today ? today : payment.nextDueOn,
        notes: payment.notes ?? "",
      })
    }
  }, [open, payment?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const isIncome = payment?.type === "income"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isIncome ? "Registrar cobro" : "Registrar pago"}</DialogTitle>
          <DialogDescription>
            {isIncome
              ? "Ingresa el monto real cobrado. Quedará registrado como ingreso."
              : "Ingresa el monto real pagado. El pago quedará registrado como transacción."}
          </DialogDescription>
        </DialogHeader>
        {isPayingEarly && (
          <Alert variant="info">
            <InfoIcon />
            <AlertTitle>Pago anticipado</AlertTitle>
            <AlertDescription>
              Vencimiento: {formatDate(payment.nextDueOn)}. La fecha de pago se pre-llenó con hoy, pero puedes cambiarla.
            </AlertDescription>
          </Alert>
        )}
        <form
          className="flex flex-col gap-5"
          id="recurring-payment-payment-form"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rpp-amount">{isIncome ? "Monto real cobrado" : "Monto real pagado"}</FieldLabel>
                  <NumberInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="rpp-amount"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
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
                  <FieldLabel>{isIncome ? "Fecha real de cobro" : "Fecha real de pago"}</FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        aria-invalid={fieldState.invalid}
                        type="button"
                        variant="outline"
                        className="justify-start text-left font-normal"
                      >
                        <CalendarIcon />
                        {field.value ? formatDate(field.value) : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value ? new Date(`${field.value}T12:00:00`) : undefined}
                        onSelect={(date) => {
                          if (date) field.onChange(format(date, "yyyy-MM-dd"))
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="rpp-notes">Notas</FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="rpp-notes"
                    placeholder="Opcional"
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
          <Button disabled={pending} form="recurring-payment-payment-form" type="submit">
            {pending && <Loader2Icon className="size-4 animate-spin" />}
            {isIncome ? "Registrar cobro" : "Registrar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
