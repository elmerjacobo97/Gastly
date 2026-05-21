"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { CheckIcon, ChevronsUpDownIcon, Loader2Icon, PlusIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import {
  createTransaction,
  getCategories,
} from "@/features/transactions/lib/transactions-api"
import {
  type TransactionType,
  type TransactionValues,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas"
import { cn } from "@/lib/utils"

type TransactionDialogProps = {
  defaultType?: TransactionType
  lockType?: boolean
  triggerLabel?: string
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

function getDialogDescription(lockType: boolean, defaultType: TransactionType) {
  if (!lockType) return "Registra un ingreso o gasto para mantener tu balance al día."
  return defaultType === "income"
    ? "Registra un ingreso para mantener tu balance al día."
    : "Registra un gasto para mantener tu balance al día."
}

export function TransactionDialog({
  defaultType = "expense",
  lockType = false,
  triggerLabel = "Nuevo movimiento",
}: TransactionDialogProps) {
  const [open, setOpen] = useState(false)
  const [categoryPopoverOpen, setCategoryPopoverOpen] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: defaultType,
      amount: 0,
      description: "",
      categoryName: "",
      occurredOn: getToday(),
      notes: "",
    },
  })

  const currentType = form.watch("type") as TransactionType
  const currentCategoryName = form.watch("categoryName")

  const categoriesQuery = useQuery({
    queryKey: ["categories", currentType],
    queryFn: () => getCategories(currentType),
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({
          queryKey: ["transactions", defaultType],
        }),
        queryClient.invalidateQueries({ queryKey: ["transaction-summary"] }),
        queryClient.invalidateQueries({
          queryKey: ["transaction-summary", defaultType],
        }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
        queryClient.invalidateQueries({ queryKey: ["monthly-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["category-totals"] }),
        queryClient.invalidateQueries({ queryKey: ["report-transactions"] }),
      ])
      form.reset({
        type: defaultType,
        amount: 0,
        description: "",
        categoryName: "",
        occurredOn: getToday(),
        notes: "",
      })
      setOpen(false)
      toast.success("Movimiento registrado")
    },
    onError: (error) => {
      toast.error("No se pudo registrar el movimiento", {
        description: error.message,
      })
    },
  })

  function onSubmit(values: TransactionValues) {
    mutation.mutate(values)
  }

  const existingCategories = categoriesQuery.data ?? []
  const isNewCategory =
    currentCategoryName.trim().length >= 2 &&
    !existingCategories.some(
      (c) => c.name.toLowerCase() === currentCategoryName.trim().toLowerCase()
    )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo movimiento</DialogTitle>
          <DialogDescription>
            {getDialogDescription(lockType, defaultType)}
          </DialogDescription>
        </DialogHeader>
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
                    disabled={lockType}
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
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="transaction-amount"
                    inputMode="decimal"
                    min="0"
                    placeholder="0.00"
                    step="0.01"
                    type="number"
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
                            field.value ? "text-foreground" : "text-muted-foreground"
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
                                      "mr-2 size-4",
                                      field.value === cat.name
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
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
        <DialogFooter>
          <Button
            disabled={mutation.isPending}
            form="transaction-form"
            type="submit"
          >
            {mutation.isPending && (
              <Loader2Icon className="mr-2 size-4 animate-spin" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
