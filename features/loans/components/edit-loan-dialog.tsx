"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { Loader2Icon } from "lucide-react"
import { useEffect } from "react"
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
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { loanSchema, type LoanValues } from "@/lib/finance/loans/schemas/loan-schemas"
import { useUpdateLoan } from "@/lib/finance/loans/hooks/mutations"
import { type Loan } from "@/lib/finance/loans/types/loan-types"

type EditLoanDialogProps = {
  loan: Loan
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditLoanDialog({ loan, open, onOpenChange }: EditLoanDialogProps) {
  const form = useForm<LoanValues>({
    resolver: zodResolver(loanSchema) as Resolver<LoanValues>,
    defaultValues: {
      direction: loan.direction,
      personName: loan.personName,
      amount: loan.amount,
      expectedOn: loan.expectedOn ?? "",
      loanedOn: loan.loanedOn,
      notes: loan.notes ?? "",
    },
  })

  const direction = useWatch({ control: form.control, name: "direction" })

  useEffect(() => {
    if (open) {
      form.reset({
        direction: loan.direction,
        personName: loan.personName,
        amount: loan.amount,
        expectedOn: loan.expectedOn ?? "",
        loanedOn: loan.loanedOn,
        notes: loan.notes ?? "",
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useUpdateLoan(loan.id)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar préstamo</DialogTitle>
          <DialogDescription>
            Modifica los datos del préstamo a {loan.personName}.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-loan-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit((v) => mutation.mutate(v, { onSuccess: () => onOpenChange(false) }))}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="direction"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="el-direction">Tipo</FieldLabel>
                  <NativeSelect {...field} id="el-direction">
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
                  <FieldLabel htmlFor="el-person">
                    {direction === "lent" ? "A quién le presté" : "Quién me prestó"}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="el-person"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Juan García"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="el-amount">Monto prestado (PEN)</FieldLabel>
                  <NumberInput
                    {...field}
                    id="el-amount"
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

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="loanedOn"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="el-date">Fecha del préstamo</FieldLabel>
                    <DatePicker
                      id="el-date"
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
                    <FieldLabel htmlFor="el-expected-on">
                      Devolución esperada{" "}
                      <span className="font-normal text-muted-foreground">(opc.)</span>
                    </FieldLabel>
                    <DatePicker
                      id="el-expected-on"
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
                  <FieldLabel htmlFor="el-notes">
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="el-notes"
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
          <Button disabled={mutation.isPending} form="edit-loan-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
