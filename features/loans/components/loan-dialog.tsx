"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form"

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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { LoanCurrencyOptions } from "@/features/loans/components/loan-currency-options"
import { normalizePersonName } from "@/features/loans/lib/group-loans"
import { loanSchema, type LoanValues } from "@/features/loans/schemas/loan-schemas"
import { createLoan } from "@/features/loans/server/actions"
import { type Loan, LOAN_CURRENCY_LABELS } from "@/features/loans/types/loan-types"

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd")
}

const EMPTY_DEFAULTS: LoanValues = {
  direction: "lent",
  personName: "",
  amount: 0,
  currency: "PEN",
  expectedOn: "",
  loanedOn: getTodayStr(),
  notes: "",
}

type LoanDialogProps = {
  triggerLabel?: string
  loans: Loan[]
  personNames: string[]
}

export function LoanDialog({
  triggerLabel = "Nuevo préstamo",
  loans,
  personNames,
}: LoanDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<LoanValues>({
    resolver: zodResolver(loanSchema) as Resolver<LoanValues>,
    defaultValues: EMPTY_DEFAULTS,
  })

  const direction = useWatch({ control: form.control, name: "direction" })
  const personName = useWatch({ control: form.control, name: "personName" })
  const currency = useWatch({ control: form.control, name: "currency" })

  const matchingBalance = loans.find(
    (loan) =>
      loan.direction === direction &&
      loan.currency === currency &&
      normalizePersonName(loan.personName) === normalizePersonName(personName ?? "")
  )

  function onSubmit(values: LoanValues) {
    startTransition(async () => {
      try {
        await createLoan(values)
        toast.success(matchingBalance ? "Monto sumado al saldo existente" : "Préstamo registrado")
        form.reset({ ...EMPTY_DEFAULTS, loanedOn: getTodayStr() })
        setOpen(false)
      } catch (error) {
        toast.error("No se pudo registrar el préstamo", {
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
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo préstamo</DialogTitle>
          <DialogDescription>
            Para una persona nueva. Si ya está en la lista, usa Otro préstamo en su tarjeta.
          </DialogDescription>
        </DialogHeader>
        <form
          id="loan-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="direction"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="loan-direction">Tipo</FieldLabel>
                  <NativeSelect {...field} id="loan-direction">
                    <NativeSelectOption value="lent">Yo presté</NativeSelectOption>
                    <NativeSelectOption value="borrowed">Me prestaron</NativeSelectOption>
                  </NativeSelect>
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="personName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="loan-person">
                    {direction === "lent" ? "A quién le presté" : "Quién me prestó"}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="loan-person"
                    list="loan-person-names"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Juan García"
                  />
                  <datalist id="loan-person-names">
                    {personNames.map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="loan-currency">Moneda</FieldLabel>
                    <NativeSelect {...field} id="loan-currency">
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
                    <FieldLabel htmlFor="loan-amount">Monto</FieldLabel>
                    <NumberInput
                      {...field}
                      id="loan-amount"
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
            {matchingBalance && (
              <FieldDescription>
                Se sumará al saldo en {LOAN_CURRENCY_LABELS[matchingBalance.currency]} de {matchingBalance.personName}.
              </FieldDescription>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="loanedOn"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="loan-date">Fecha del préstamo</FieldLabel>
                    <DatePicker
                      id="loan-date"
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
                name="expectedOn"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="loan-expected-on">
                      Devolución esperada{" "}
                      <span className="font-normal text-muted-foreground">(opc.)</span>
                    </FieldLabel>
                    <DatePicker
                      id="loan-expected-on"
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Sin fecha"
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
                  <FieldLabel htmlFor="loan-notes">
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="loan-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Para emergencia médica"
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
          <Button disabled={isPending} form="loan-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Registrar préstamo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
