"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
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
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { loanSchema, type LoanValues } from "@/features/loans/schemas/loan-schemas"
import { createLoan } from "@/features/loans/lib/loans-api"

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd")
}

type LoanDialogProps = {
  triggerLabel?: string
}

export function LoanDialog({ triggerLabel = "Nuevo préstamo" }: LoanDialogProps) {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<LoanValues>({
    resolver: zodResolver(loanSchema),
    defaultValues: { direction: "lent", personName: "", amount: 0, expectedOn: "", loanedOn: getTodayStr(), notes: "" },
  })

  useEffect(() => {
    if (open) {
      form.reset({ direction: "lent", personName: "", amount: 0, expectedOn: "", loanedOn: getTodayStr(), notes: "" })
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useMutation({
    mutationFn: createLoan,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["loans"] })
      setOpen(false)
      toast.success("Préstamo registrado")
    },
    onError: (error) => {
      toast.error("No se pudo registrar", { description: error.message })
    },
  })

  const direction = form.watch("direction")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo préstamo</DialogTitle>
          <DialogDescription>
            Registra dinero prestado para hacer seguimiento del cobro.
          </DialogDescription>
        </DialogHeader>
        <form
          id="loan-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
        >
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
          <FieldGroup>
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
                  <FieldLabel htmlFor="loan-amount">Monto prestado</FieldLabel>
                  <Input
                    {...field}
                    id="loan-amount"
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
          <Button disabled={mutation.isPending} form="loan-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Registrar préstamo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
