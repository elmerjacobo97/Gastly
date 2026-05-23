"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
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
  FieldDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { QuickCreateCategoryDialog } from "@/features/categories/components/quick-create-category-dialog"
import { getCategories } from "@/features/categories/lib/categories-api"
import { updateTransaction } from "@/features/transactions/lib/transactions-api"
import {
  type TransactionType,
  type TransactionValues,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { cn } from "@/lib/utils"

type EditTransactionDialogProps = {
  transaction: Transaction
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
  }
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
}: EditTransactionDialogProps) {
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
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
  const currentCategoryName = useWatch({ control: form.control, name: "categoryName" })

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
  const isNewCategory =
    currentCategoryName.trim().length >= 2 &&
    !existingCategories.some(
      (c) => c.name.toLowerCase() === currentCategoryName.trim().toLowerCase()
    )

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
                        <Popover open={categoryPopoverOpen} onOpenChange={setCategoryPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={categoryPopoverOpen}
                              aria-invalid={fieldState.invalid}
                              className="w-full justify-between font-normal"
                            >
                              <span className={field.value ? "text-foreground" : "text-muted-foreground"}>
                                {field.value || "Selecciona o escribe una categoría"}
                              </span>
                              <ChevronsUpDownIcon className="ml-2 size-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-full p-0" align="start">
                            <Command>
                              <CommandInput
                                placeholder="Buscar o crear categoría..."
                                value={field.value}
                                onValueChange={field.onChange}
                              />
                              <CommandList>
                                <CommandEmpty>
                                  <span className="text-muted-foreground">Sin resultados</span>
                                </CommandEmpty>
                                {existingCategories.length > 0 && (
                                  <CommandGroup heading="Categorías existentes">
                                    {existingCategories.map((cat) => (
                                      <CommandItem
                                        key={cat.id}
                                        value={cat.name}
                                        onSelect={() => {
                                          field.onChange(cat.name)
                                          setCategoryPopoverOpen(false)
                                        }}
                                      >
                                        <CheckIcon
                                          className={cn(
                                            "size-4",
                                            field.value === cat.name ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        <CategoryIconBadge
                                          icon={cat.icon}
                                          color={cat.color}
                                          className="size-7 rounded-md"
                                        />
                                        {cat.name}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                )}
                                {isNewCategory && (
                                  <>
                                    {existingCategories.length > 0 && <CommandSeparator />}
                                    <CommandGroup heading="Nueva">
                                      <CommandItem
                                        value={`__new__${field.value}`}
                                        onSelect={() => setCategoryPopoverOpen(false)}
                                      >
                                        <PlusIcon className="mr-2 size-4" />
                                        Crear &ldquo;{field.value}&rdquo;
                                      </CommandItem>
                                    </CommandGroup>
                                  </>
                                )}
                                <CommandSeparator />
                                <CommandGroup>
                                  <CommandItem
                                    value="__quick_create__"
                                    onSelect={() => {
                                      setCategoryPopoverOpen(false)
                                      setQuickCreateOpen(true)
                                    }}
                                  >
                                    <PlusIcon className="mr-2 size-4" />
                                    Nueva categoría con ícono y color
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {isNewCategory && (
                          <FieldDescription>Esta categoría se creará automáticamente.</FieldDescription>
                        )}
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
