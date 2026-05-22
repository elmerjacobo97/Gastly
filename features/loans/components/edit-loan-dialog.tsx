"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
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
import { loanSchema, type LoanValues } from "@/features/loans/schemas/loan-schemas"
import { updateLoan } from "@/features/loans/lib/loans-api"
import { type Loan } from "@/features/loans/types/loan-types"

type EditLoanDialogProps = {
  loan: Loan
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditLoanDialog({ loan, open, onOpenChange }: EditLoanDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<LoanValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: {
      direction: loan.direction,
      currency: loan.currency,
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
        currency: loan.currency,
        personName: loan.personName,
        amount: loan.amount,
        expectedOn: loan.expectedOn ?? "",
        loanedOn: loan.loanedOn,
        notes: loan.notes ?? "",
      })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: (values: LoanValues) => updateLoan(loan.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] })
      onOpenChange(false)
      toast.success("Préstamo actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar", { description: error.message })
    },
  })

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
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
          <div className="grid grid-cols-2 gap-3">
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
              name="currency"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="el-currency">Moneda</FieldLabel>
                  <NativeSelect {...field} id="el-currency">
                    <NativeSelectOption value="PEN">PEN</NativeSelectOption>
                    <NativeSelectOption value="USD">USD</NativeSelectOption>
                    <NativeSelectOption value="MXN">MXN</NativeSelectOption>
                  </NativeSelect>
                </Field>
              )}
            />
          </div>
          <FieldGroup>
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
                  <FieldLabel htmlFor="el-amount">Monto prestado</FieldLabel>
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
          <Button disabled={mutation.isPending} form="edit-loan-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
