"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { NumberInput } from "@/components/ui/number-input"
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { QuickCreateCategoryDialog } from "@/features/categories/components/quick-create-category-dialog"
import { getCategories } from "@/features/categories/lib/categories-api"
import { updateTransaction } from "@/features/transactions/lib/transactions-api"
import {
  CURRENCIES,
  type TransactionType,
  type TransactionValues,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas"
import { type Transaction } from "@/features/transactions/types/transaction-types"

type EditTransactionDialogProps = {
  transaction: Transaction
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildValues(transaction: Transaction): TransactionValues {
  return {
    type: transaction.type,
    amount: transaction.amount,
    currency: (CURRENCIES.includes(transaction.currency as typeof CURRENCIES[number]) ? transaction.currency : "PEN") as typeof CURRENCIES[number],
    description: transaction.description,
    categoryName: transaction.category?.name ?? "",
    occurredOn: transaction.occurredOn,
    notes: transaction.notes ?? "",
  }
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: buildValues(transaction),
  })

  useEffect(() => {
    if (open) form.reset(buildValues(transaction))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentType = useWatch({ control: form.control, name: "type" }) as TransactionType

  const categoriesQuery = useQuery({
    queryKey: ["categories", currentType],
    queryFn: () => getCategories(currentType),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (values: TransactionValues) => updateTransaction(transaction.id, values),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["budgets"] }),
      ])
      onOpenChange(false)
      toast.success("Transacción actualizada")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar la transacción", { description: error.message })
    },
  })

  const existingCategories = categoriesQuery.data ?? []

  return (
    <>
      <QuickCreateCategoryDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        defaultType={currentType}
        onCreated={(_id, name) => form.setValue("categoryName", name, { shouldValidate: true })}
      />
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar transacción</DialogTitle>
            <DialogDescription>Modifica los datos de la transacción.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="-mx-4 min-h-0">
            <div className="px-4 pb-1">
              <form
                className="flex flex-col gap-5"
                id="edit-transaction-form"
                noValidate
                onSubmit={form.handleSubmit((v) => mutation.mutate(v))}
              >
                <FieldGroup>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="et-type">Tipo</FieldLabel>
                        <NativeSelect
                          {...field}
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                          disabled
                          id="et-type"
                        >
                          <NativeSelectOption value="expense">Gasto</NativeSelectOption>
                          <NativeSelectOption value="income">Ingreso</NativeSelectOption>
                        </NativeSelect>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Controller
                      control={form.control}
                      name="amount"
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor="et-amount">Monto</FieldLabel>
                          <NumberInput
                            {...field}
                            aria-invalid={fieldState.invalid}
                            id="et-amount"
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
                      name="currency"
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor="et-currency">Moneda</FieldLabel>
                          <NativeSelect {...field} id="et-currency" className="w-full">
                            {CURRENCIES.map((c) => (
                              <NativeSelectOption key={c} value={c}>{c}</NativeSelectOption>
                            ))}
                          </NativeSelect>
                        </Field>
                      )}
                    />
                  </div>
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="et-description">Descripción</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="et-description"
                          placeholder="Ej. Almuerzo, sueldo de mayo"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="categoryName"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Categoría</FieldLabel>
                        <div className="flex gap-2">
                          <Select value={field.value || undefined} onValueChange={field.onChange}>
                            <SelectTrigger aria-invalid={fieldState.invalid} className="flex-1">
                              <SelectValue placeholder="Selecciona una categoría" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {existingCategories.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.name}>
                                    <CategoryIconBadge
                                      icon={cat.icon}
                                      color={cat.color}
                                      className="size-5 rounded-md"
                                    />
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => setQuickCreateOpen(true)}
                          >
                            <PlusIcon className="size-4" />
                          </Button>
                        </div>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="occurredOn"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="et-date">Fecha</FieldLabel>
                        <DatePicker
                          id="et-date"
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
                    render={({ field }) => (
                      <Field>
                        <FieldLabel htmlFor="et-notes">
                          Notas <span className="text-muted-foreground">(opcional)</span>
                        </FieldLabel>
                        <Textarea {...field} id="et-notes" placeholder="Detalle adicional" rows={2} />
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
            <Button disabled={mutation.isPending} form="edit-transaction-form" type="submit">
              {mutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
