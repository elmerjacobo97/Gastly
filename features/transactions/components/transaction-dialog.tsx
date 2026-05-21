"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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
import { Textarea } from "@/components/ui/textarea"
import { createTransaction } from "@/features/transactions/lib/transactions-api"
import {
  type TransactionType,
  type TransactionValues,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas"

type TransactionDialogProps = {
  defaultType?: TransactionType
  lockType?: boolean
  triggerLabel?: string
}

function getToday() {
  return new Date().toISOString().slice(0, 10)
}

export function TransactionDialog({
  defaultType = "expense",
  lockType = false,
  triggerLabel = "Nuevo movimiento",
}: TransactionDialogProps) {
  const [open, setOpen] = useState(false)
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
  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["transactions"] }),
        queryClient.invalidateQueries({ queryKey: ["transactions", defaultType] }),
        queryClient.invalidateQueries({ queryKey: ["transaction-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["transaction-summary", defaultType] }),
        queryClient.invalidateQueries({ queryKey: ["categories"] }),
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
      toast.success("Movimiento creado")
    },
    onError: (error) => {
      toast.error("No se pudo crear el movimiento", {
        description: error.message,
      })
    },
  })

  function onSubmit(values: TransactionValues) {
    mutation.mutate(values)
  }

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
            Registra {lockType && defaultType === "expense" ? "un gasto" : "un gasto o ingreso"} para mantener tu balance actualizado.
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
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
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
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-description">
                    Descripcion
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="transaction-description"
                    placeholder="Ej. Almuerzo, sueldo, transporte"
                  />
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="categoryName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="transaction-category">Categoria</FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="transaction-category"
                    placeholder="Ej. Comida, trabajo, movilidad"
                  />
                  <FieldDescription>
                    Si la categoria no existe, se creara automaticamente.
                  </FieldDescription>
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
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
                  {fieldState.invalid ? (
                    <FieldError errors={[fieldState.error]} />
                  ) : null}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="notes"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="transaction-notes">Notas</FieldLabel>
                  <Textarea
                    {...field}
                    id="transaction-notes"
                    placeholder="Detalle opcional"
                    rows={3}
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
            Guardar movimiento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
