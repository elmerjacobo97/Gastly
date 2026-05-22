"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { CalendarIcon, Loader2Icon } from "lucide-react"
import { useEffect } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

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
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { getCategories } from "@/features/categories/lib/categories-api"
import { updateFixedExpense } from "@/features/fixed-expenses/lib/fixed-expenses-api"
import {
  fixedExpenseSchema,
  type FixedExpenseValues,
} from "@/features/fixed-expenses/schemas/fixed-expense-schemas"
import { type FixedExpense } from "@/features/fixed-expenses/types/fixed-expense-types"
import { formatDate } from "@/lib/format"

type EditFixedExpenseDialogProps = {
  expense: FixedExpense
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildValues(expense: FixedExpense): FixedExpenseValues {
  return {
    description: expense.description,
    amount: expense.amount,
    categoryId: expense.category?.id ?? "",
    frequency: expense.frequency,
    intervalMonths: expense.intervalMonths ?? 2,
    paymentKind: expense.paymentKind,
    nextDueOn: expense.nextDueOn,
    notes: expense.notes ?? "",
  }
}

export function EditFixedExpenseDialog({
  expense,
  open,
  onOpenChange,
}: EditFixedExpenseDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<FixedExpenseValues>({
    resolver: zodResolver(fixedExpenseSchema),
    defaultValues: buildValues(expense),
  })

  useEffect(() => {
    if (open) form.reset(buildValues(expense))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const frequency = useWatch({ control: form.control, name: "frequency" })

  const categoriesQuery = useQuery({
    queryKey: ["categories", "expense"],
    queryFn: () => getCategories("expense"),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (values: FixedExpenseValues) => updateFixedExpense(expense.id, values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["fixed-expenses"] })
      onOpenChange(false)
      toast.success("Pago recurrente actualizado")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar el pago recurrente", { description: error.message })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar pago recurrente</DialogTitle>
          <DialogDescription>
            Modifica los datos del pago recurrente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              className="flex flex-col gap-5"
              id="edit-fixed-expense-form"
              noValidate
              onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
            >
              <FieldGroup>
                <Controller
                  control={form.control}
                  name="description"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="efe-description">Nombre</FieldLabel>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id="efe-description"
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
                      <FieldLabel htmlFor="efe-amount">Monto estimado en soles</FieldLabel>
                      <NumberInput
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id="efe-amount"
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
                      <FieldLabel htmlFor="efe-category">Categoría</FieldLabel>
                      <NativeSelect {...field} aria-invalid={fieldState.invalid} id="efe-category">
                        <NativeSelectOption value="">Selecciona una categoría</NativeSelectOption>
                        {categoriesQuery.data?.map((c) => (
                          <NativeSelectOption key={c.id} value={c.id}>{c.name}</NativeSelectOption>
                        ))}
                      </NativeSelect>
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
                        <FieldLabel htmlFor="efe-frequency">Frecuencia</FieldLabel>
                        <NativeSelect {...field} aria-invalid={fieldState.invalid} id="efe-frequency">
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
                          <FieldLabel htmlFor="efe-interval">Intervalo</FieldLabel>
                          <div className="relative">
                            <NumberInput
                              {...field}
                              aria-invalid={fieldState.invalid}
                              id="efe-interval"
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
                      <FieldLabel htmlFor="efe-kind">Tipo de monto</FieldLabel>
                      <NativeSelect {...field} aria-invalid={fieldState.invalid} id="efe-kind">
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
                      <FieldLabel htmlFor="efe-notes">Notas</FieldLabel>
                      <Textarea
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id="efe-notes"
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
          <Button disabled={mutation.isPending} form="edit-fixed-expense-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
