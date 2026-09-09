"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
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
import { NativeSelect } from "@/components/ui/native-select"
import { LoanCurrencyOptions } from "@/features/loans/components/loan-currency-options"
import { addLoanSchema, type AddLoanValues } from "@/features/loans/schemas/loan-schemas"
import { createLoan } from "@/features/loans/server/actions"
import { type LoanPersonGroup } from "@/features/loans/types/loan-types"

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd")
}

function defaultCurrency(group: LoanPersonGroup) {
  return group.balances.find((loan) => !loan.isSettled)?.currency ?? "PEN"
}

type AddLoanDialogProps = {
  group: LoanPersonGroup
}

export function AddLoanDialog({ group }: AddLoanDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const formId = `add-loan-form-${group.key.replaceAll(/[^a-z0-9-]/gi, "-")}`

  const form = useForm<AddLoanValues>({
    resolver: zodResolver(addLoanSchema) as Resolver<AddLoanValues>,
    defaultValues: {
      amount: 0,
      currency: defaultCurrency(group),
      loanedOn: getTodayStr(),
      notes: "",
    },
  })

  function onSubmit(values: AddLoanValues) {
    startTransition(async () => {
      try {
        await createLoan({
          direction: group.direction,
          personName: group.personName,
          amount: values.amount,
          currency: values.currency,
          loanedOn: values.loanedOn,
          notes: values.notes,
        })
        toast.success("Monto sumado al saldo")
        form.reset({
          amount: 0,
          currency: defaultCurrency(group),
          loanedOn: getTodayStr(),
          notes: "",
        })
        setOpen(false)
      } catch (error) {
        toast.error("No se pudo registrar el préstamo", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          form.reset({
            amount: 0,
            currency: defaultCurrency(group),
            loanedOn: getTodayStr(),
            notes: "",
          })
        }
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <PlusIcon data-icon="inline-start" />
          Otro préstamo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {group.direction === "lent"
              ? `Otro préstamo a ${group.personName}`
              : `Otro préstamo de ${group.personName}`}
          </DialogTitle>
          <DialogDescription>
            Se sumará a su saldo en esa moneda. Si eliges una moneda nueva, se abre otro saldo en esta tarjeta.
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor={`${formId}-currency`}>Moneda</FieldLabel>
                    <NativeSelect {...field} id={`${formId}-currency`}>
                      <LoanCurrencyOptions />
                    </NativeSelect>
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${formId}-amount`}>Monto</FieldLabel>
                    <NumberInput
                      {...field}
                      id={`${formId}-amount`}
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
            <Controller
              control={form.control}
              name="loanedOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-date`}>Fecha</FieldLabel>
                  <DatePicker
                    id={`${formId}-date`}
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
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-notes`}>
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-notes`}
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Pollo de pico rico"
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
          <Button disabled={isPending} form={formId} type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Sumar al saldo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
