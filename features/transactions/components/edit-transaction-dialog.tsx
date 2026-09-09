"use client"

import { zodResolver } from "@hookform/resolvers/zod"
 import { Loader2Icon } from "lucide-react"
import { useEffect, useState, useTransition } from "react"
import { toast } from "sonner"
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { TransactionCategoryField } from "@/components/transaction-category-field"
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
import { Textarea } from "@/components/ui/textarea"
import { QuickCreateCategoryDialog } from "@/components/quick-create-category-dialog"
import { type Category } from "@/features/categories/types/category-types"
import { updateTransaction } from "@/features/transactions/server/actions"
import {
  type TransactionType,
  type TransactionValues,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas"
import { type Transaction } from "@/features/transactions/types/transaction-types"

type EditTransactionDialogProps = {
  transaction: Transaction
  categories: Category[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

function buildValues(transaction: Transaction): TransactionValues {
  return {
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    categoryName: transaction.category?.name ?? "",
    occurredOn: transaction.occurredOn,
    notes: transaction.notes ?? "",
    paymentMethod: transaction.paymentMethod,
    creditCardName: transaction.creditCardName ?? "",
    creditCardDueOn: transaction.creditCardDueOn ?? "",
  }
}

export function EditTransactionDialog({
  transaction,
  categories,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionValues>,
    defaultValues: buildValues(transaction),
  })

  useEffect(() => {
    if (open) form.reset(buildValues(transaction))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentType = useWatch({ control: form.control, name: "type" }) as TransactionType
  const currentPaymentMethod = useWatch({ control: form.control, name: "paymentMethod" })

  const [isPending, startTransition] = useTransition()

  const existingCategories = categories.filter((c) => c.type === currentType)

  function onSubmit(values: TransactionValues) {
    startTransition(async () => {
      try {
        await updateTransaction(transaction.id, values)
        toast.success("Transacción actualizada")
        onOpenChange(false)
      } catch (error) {
        toast.error("No se pudo actualizar la transacción", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

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
                onSubmit={form.handleSubmit(onSubmit)}
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
                  <Controller
                    control={form.control}
                    name="amount"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="et-amount">Monto (PEN)</FieldLabel>
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
                      <TransactionCategoryField
                        categories={existingCategories}
                        value={field.value}
                        invalid={fieldState.invalid}
                        error={fieldState.error}
                        onChange={field.onChange}
                        onCreate={() => setQuickCreateOpen(true)}
                      />
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
                  {transaction.type === "expense" && (
                    <>
                      <Controller
                        control={form.control}
                        name="paymentMethod"
                        render={({ field }) => (
                          <Field>
                            <FieldLabel htmlFor="et-payment-method">Método de pago</FieldLabel>
                            <NativeSelect {...field} className="w-full" id="et-payment-method">
                              <NativeSelectOption value="cash">Efectivo / Débito</NativeSelectOption>
                              <NativeSelectOption value="credit_card">Tarjeta de crédito</NativeSelectOption>
                            </NativeSelect>
                          </Field>
                        )}
                      />
                      {currentPaymentMethod === "credit_card" && (
                        <>
                          <Controller
                            control={form.control}
                            name="creditCardName"
                            render={({ field }) => (
                              <Field>
                                <FieldLabel htmlFor="et-card-name">
                                  Nombre de tarjeta{" "}
                                  <span className="text-muted-foreground">(opcional)</span>
                                </FieldLabel>
                                <Input
                                  {...field}
                                  id="et-card-name"
                                  placeholder="Ej. Visa BCP, Mastercard BBVA"
                                />
                              </Field>
                            )}
                          />
                          <Controller
                            control={form.control}
                            name="creditCardDueOn"
                            render={({ field }) => (
                              <Field>
                                <FieldLabel htmlFor="et-due-on">
                                  Fecha de vencimiento{" "}
                                  <span className="text-muted-foreground">(opcional)</span>
                                </FieldLabel>
                                <DatePicker
                                  id="et-due-on"
                                  value={field.value ?? ""}
                                  onChange={field.onChange}
                                />
                              </Field>
                            )}
                          />
                        </>
                      )}
                    </>
                  )}
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
          <Button disabled={isPending} form="edit-transaction-form" type="submit">
            {isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
