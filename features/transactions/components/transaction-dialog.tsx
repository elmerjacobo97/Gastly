"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
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
  DialogContent,
  DialogDescription,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { CategoryIconBadge } from "@/features/categories/components/category-icon"
import { getCategories } from "@/features/categories/lib/categories-api"
import {
  createTransaction,
  updateTransaction,
} from "@/features/transactions/lib/transactions-api"
import {
  type TransactionType,
  type TransactionValues,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas"
import { type Transaction } from "@/features/transactions/types/transaction-types"
import { cn } from "@/lib/utils"

type TransactionDialogProps = {
  defaultType?: TransactionType
  lockType?: boolean
  triggerLabel?: string
  trigger?: React.ReactNode
  transaction?: Transaction
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

function getToday() {
  return format(new Date(), "yyyy-MM-dd")
}

function buildDefaultValues(
  transaction: Transaction | undefined,
  defaultType: TransactionType
): TransactionValues {
  if (transaction) {
    return {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      categoryName: transaction.category?.name ?? "",
      occurredOn: transaction.occurredOn,
      notes: transaction.notes ?? "",
    }
  }
  return {
    type: defaultType,
    amount: 0,
    description: "",
    categoryName: "",
    occurredOn: getToday(),
    notes: "",
  }
}

export function TransactionDialog({
  defaultType = "expense",
  lockType = false,
  triggerLabel = "Nueva transacción",
  trigger,
  transaction,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: TransactionDialogProps) {
  const isEditing = !!transaction
  const isControlled = controlledOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? controlledOpen : internalOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: buildDefaultValues(transaction, defaultType),
  })

  useEffect(() => {
    if (open) {
      form.reset(buildDefaultValues(transaction, defaultType))
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const currentType = useWatch({ control: form.control, name: "type" }) as TransactionType
  const currentCategoryName = useWatch({ control: form.control, name: "categoryName" })

  const categoriesQuery = useQuery({
    queryKey: ["categories", currentType],
    queryFn: () => getCategories(currentType),
    enabled: open,
  })

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
      queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
      queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["categories"] }),
    ])
  }

  const createMutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await invalidate()
      form.reset(buildDefaultValues(undefined, defaultType))
      setOpen(false)
      toast.success("Transacción registrada")
    },
    onError: (error) => {
      toast.error("No se pudo registrar la transacción", {
        description: error.message,
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: TransactionValues) =>
      updateTransaction(transaction!.id, values),
    onSuccess: async () => {
      await invalidate()
      setOpen(false)
      toast.success("Transacción actualizada")
    },
    onError: (error) => {
      toast.error("No se pudo actualizar la transacción", {
        description: error.message,
      })
    },
  })

  const mutation = isEditing ? updateMutation : createMutation
  const isPending = mutation.isPending

  function onSubmit(values: TransactionValues) {
    mutation.mutate(values)
  }

  const existingCategories = categoriesQuery.data ?? []
  const isNewCategory =
    currentCategoryName.trim().length >= 2 &&
    !existingCategories.some(
      (c) => c.name.toLowerCase() === currentCategoryName.trim().toLowerCase()
    )

  const defaultTrigger = (
    <Button>
      <PlusIcon data-icon="inline-start" />
      <span className="hidden sm:inline">{triggerLabel}</span>
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      )}
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar transacción" : "Nueva transacción"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifica los datos de la transacción."
              : "Registra un ingreso o gasto para mantener tu balance al día."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              className="flex flex-col gap-5"
              id="transaction-form"
              noValidate
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FieldGroup>
            <Controller
              control={form.control}
              name="type"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-type">Tipo</FieldLabel>
                  <NativeSelect
                    {...field}
                    aria-invalid={fieldState.invalid}
                    className="w-full"
                    disabled={lockType || isEditing}
                    id="transaction-type"
                  >
                    <NativeSelectOption value="expense">Gasto</NativeSelectOption>
                    <NativeSelectOption value="income">Ingreso</NativeSelectOption>
                  </NativeSelect>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="amount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-amount">Monto</FieldLabel>
                  <NumberInput
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="transaction-amount"
                    inputMode="decimal"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-description">
                    Descripción
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="transaction-description"
                    placeholder="Ej. Almuerzo, sueldo de mayo"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="categoryName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Categoría</FieldLabel>
                  <Popover
                    open={categoryPopoverOpen}
                    onOpenChange={setCategoryPopoverOpen}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={categoryPopoverOpen}
                        aria-invalid={fieldState.invalid}
                        className="w-full justify-between font-normal"
                      >
                        <span
                          className={
                            field.value
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }
                        >
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
                            <span className="text-muted-foreground">
                              Sin resultados
                            </span>
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
                                      field.value === cat.name
                                        ? "opacity-100"
                                        : "opacity-0"
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
                              {existingCategories.length > 0 && (
                                <CommandSeparator />
                              )}
                              <CommandGroup heading="Nueva">
                                <CommandItem
                                  value={`__new__${field.value}`}
                                  onSelect={() => {
                                    setCategoryPopoverOpen(false)
                                  }}
                                >
                                  <PlusIcon className="mr-2 size-4" />
                                  Crear &ldquo;{field.value}&rdquo;
                                </CommandItem>
                              </CommandGroup>
                            </>
                          )}
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {isNewCategory && (
                    <FieldDescription>
                      Esta categoría se creará automáticamente.
                    </FieldDescription>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="occurredOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-date">Fecha</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="transaction-date"
                    type="date"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="transaction-notes">
                    Notas{" "}
                    <span className="text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id="transaction-notes"
                    placeholder="Detalle adicional"
                    rows={2}
                  />
                </Field>
              )}
            />
              </FieldGroup>
            </form>
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button
            disabled={isPending}
            form="transaction-form"
            type="submit"
          >
            {isPending && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            {isEditing ? "Guardar cambios" : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
