"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
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
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { createFixedExpense } from "@/features/fixed-expenses/lib/fixed-expenses-api"
import { AccountCombobox } from "@/features/accounts/components/account-combobox"
import { CategoryCombobox } from "@/features/categories/components/category-combobox"
import {
  fixedExpenseSchema,
  type FixedExpenseValues,
} from "@/features/fixed-expenses/schemas/fixed-expense-schemas"

function buildDefaultValues(): FixedExpenseValues {
  return {
    description: "",
    amount: 0,
    categoryId: "",
    frequency: "monthly",
    intervalMonths: 2,
    paymentKind: "fixed",
    nextDueOn: format(new Date(), "yyyy-MM-dd"),
    accountId: "",
    notes: "",
  }
}

export function CreateFixedExpenseDialog() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<FixedExpenseValues>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: buildDefaultValues(),
  })

  const frequency = useWatch({ control: form.control, name: "frequency" })

  const mutation = useMutation({
    mutationFn: createFixedExpense,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] })
      form.reset(buildDefaultValues())
      setOpen(false)
      toast.success("Pago recurrente guardado")
    },
    onError: (error) => {
      toast.error("No se pudo guardar el pago recurrente", { description: error.message })
    },
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <PlusIcon data-icon="inline-start" />
            <span className="hidden sm:inline">Nuevo pago recurrente</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo pago recurrente</DialogTitle>
            <DialogDescription>
              Registra pagos recurrentes con monto estimado. El monto real se define al pagar.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="-mx-4 min-h-0">
            <div className="px-4 pb-1">
              <form
                className="flex flex-col gap-5"
                id="create-fixed-expense-form"
                noValidate
                onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              >
                <FieldGroup>
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cfe-description">Nombre</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="cfe-description"
                          placeholder="Disney+, Luz, Claude Code"
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
                        <FieldLabel htmlFor="cfe-amount">Monto estimado en soles</FieldLabel>
                        <NumberInput
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="cfe-amount"
                          inputMode="decimal"
                          min="0"
                          placeholder="0.00"
                          step="0.01"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="categoryId"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cfe-category">Categoría</FieldLabel>
                        <CategoryCombobox
                          id="cfe-category"
                          value={field.value}
                          onChange={field.onChange}
                          type="expense"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="frequency"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="cfe-frequency">Frecuencia</FieldLabel>
                          <NativeSelect {...field} aria-invalid={fieldState.invalid} id="cfe-frequency">
                            <NativeSelectOption value="monthly">Mensual</NativeSelectOption>
                            <NativeSelectOption value="custom_months">Cada X meses</NativeSelectOption>
                            <NativeSelectOption value="yearly">Anual</NativeSelectOption>
                          </NativeSelect>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />
                    {frequency === "custom_months" ? (
                      <Controller
                        control={form.control}
                        name="intervalMonths"
                        render={({ field, fieldState }) => (
                          <Field data-invalid={fieldState.invalid}>
                            <FieldLabel htmlFor="cfe-interval">Intervalo</FieldLabel>
                            <div className="relative">
                              <NumberInput
                                {...field}
                                aria-invalid={fieldState.invalid}
                                id="cfe-interval"
                                inputMode="numeric"
                                min="1"
                                max="120"
                                className="w-full pr-16"
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
                                meses
                              </span>
                            </div>
                            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                          </Field>
                        )}
                      />
                    ) : (
                      <Field>
                        <FieldLabel>Intervalo</FieldLabel>
                        <div className="flex h-9 items-center rounded-md border bg-muted/30 px-3 text-sm text-muted-foreground">
                          {frequency === "yearly" ? "Cada 12 meses" : "Cada 1 mes"}
                        </div>
                      </Field>
                    )}
                  </div>
                  <Controller
                    control={form.control}
                    name="paymentKind"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cfe-kind">Tipo de monto</FieldLabel>
                        <NativeSelect {...field} aria-invalid={fieldState.invalid} id="cfe-kind">
                          <NativeSelectOption value="fixed">Fijo</NativeSelectOption>
                          <NativeSelectOption value="variable">Variable</NativeSelectOption>
                        </NativeSelect>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="nextDueOn"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Próxima fecha de pago</FieldLabel>
                        <DatePicker
                          id="cfe-next-due"
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
                    name="accountId"
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="cfe-account">
                          Cuenta de débito <span className="font-normal text-muted-foreground">(opcional)</span>
                        </FieldLabel>
                        <AccountCombobox
                          id="cfe-account"
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="notes"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="cfe-notes">Notas</FieldLabel>
                        <Textarea
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="cfe-notes"
                          placeholder="Opcional"
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
            <Button disabled={mutation.isPending} form="create-fixed-expense-form" type="submit">
              {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
              Guardar pago recurrente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
  )
}
