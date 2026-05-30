"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"

import { Button } from "@/components/ui/button"
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
import { useCategories } from "@/features/categories/hooks/queries"
import { useCreateTransaction } from "@/features/transactions/hooks/mutations"
import {
  type TransactionType,
  type TransactionValues,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas"

type CreateTransactionDialogProps = {
  defaultType?: TransactionType
  lockType?: boolean
  triggerLabel?: string
  trigger?: React.ReactNode
}

function getToday() {
  return format(new Date(), "yyyy-MM-dd")
}

function buildDefaultValues(defaultType: TransactionType): TransactionValues {
  return {
    type: defaultType,
    amount: 0,
    description: "",
    categoryName: "",
    occurredOn: getToday(),
    notes: "",
  }
}

export function CreateTransactionDialog({
  defaultType = "expense",
  lockType = false,
  triggerLabel = "Nueva transacción",
  trigger,
}: CreateTransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [quickCreateOpen, setQuickCreateOpen] = useState(false)

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: buildDefaultValues(defaultType),
  })

  const currentType = useWatch({ control: form.control, name: "type" }) as TransactionType

  const categoriesQuery = useCategories(currentType, open)

  const mutation = useCreateTransaction()

  const existingCategories = categoriesQuery.data ?? []

  const defaultTrigger = (
    <Button>
      <PlusIcon data-icon="inline-start" />
      <span className="hidden sm:inline">{triggerLabel}</span>
    </Button>
  )

  return (
    <>
      <QuickCreateCategoryDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        defaultType={currentType}
        onCreated={(_id, name) => form.setValue("categoryName", name, { shouldValidate: true })}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva transacción</DialogTitle>
            <DialogDescription>
              Registra un ingreso o gasto para mantener tu balance al día.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="-mx-4 min-h-0">
            <div className="px-4 pb-1">
              <form
                className="flex flex-col gap-5"
                id="create-transaction-form"
                noValidate
                onSubmit={form.handleSubmit((v) => mutation.mutate(v, {
                  onSuccess: () => { form.reset(buildDefaultValues(defaultType)); setOpen(false) },
                }))}
              >
                <FieldGroup>
                  <Controller
                    control={form.control}
                    name="type"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="ct-type">Tipo</FieldLabel>
                        <NativeSelect
                          {...field}
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                          disabled={lockType}
                          id="ct-type"
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
                        <FieldLabel htmlFor="ct-amount">Monto (PEN)</FieldLabel>
                        <NumberInput
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="ct-amount"
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
                        <FieldLabel htmlFor="ct-description">Descripción</FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="ct-description"
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
                        <FieldLabel htmlFor="ct-date">Fecha</FieldLabel>
                        <DatePicker
                          id="ct-date"
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
                        <FieldLabel htmlFor="ct-notes">
                          Notas <span className="text-muted-foreground">(opcional)</span>
                        </FieldLabel>
                        <Textarea {...field} id="ct-notes" placeholder="Detalle adicional" rows={2} />
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
            <Button disabled={mutation.isPending} form="create-transaction-form" type="submit">
              {mutation.isPending && <Loader2Icon className="mr-2 size-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
