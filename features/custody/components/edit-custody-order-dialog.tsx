"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon } from "lucide-react"
import { useEffect, useTransition } from "react"
import { toast } from "sonner"
import { type Resolver, Controller, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
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
  custodyOrderSchema,
  type CustodyOrderValues,
} from "@/features/custody/schemas/custody-schemas"
import { updateCustodyOrder } from "@/features/custody/server/actions"
import { type CustodyOrder } from "@/features/custody/types/custody-types"

type EditCustodyOrderDialogProps = {
  order: CustodyOrder
  open: boolean
  onOpenChange: (open: boolean) => void
}

function toFormValues(order: CustodyOrder): CustodyOrderValues {
  return {
    personName: order.personName,
    title: order.title,
    targetAmount: order.targetAmount ?? undefined,
    expectedOn: order.expectedOn ?? "",
    notes: order.notes ?? "",
  }
}

export function EditCustodyOrderDialog({
  order,
  open,
  onOpenChange,
}: EditCustodyOrderDialogProps) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<CustodyOrderValues>({
    resolver: zodResolver(custodyOrderSchema) as Resolver<CustodyOrderValues>,
    defaultValues: toFormValues(order),
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(order))
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  function onSubmit(values: CustodyOrderValues) {
    startTransition(async () => {
      try {
        await updateCustodyOrder(order.id, values)
        toast.success("Encargo actualizado")
        onOpenChange(false)
      } catch (error) {
        toast.error("No se pudo actualizar el encargo", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar encargo</DialogTitle>
          <DialogDescription>
            Modifica los datos del encargo de {order.personName}.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-custody-order-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="personName"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eco-person">Persona</FieldLabel>
                  <Input
                    {...field}
                    id="eco-person"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: María López"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eco-title">Propósito</FieldLabel>
                  <Input
                    {...field}
                    id="eco-title"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Compra de laptop"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="targetAmount"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eco-target">
                    Monto objetivo (PEN){" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <NumberInput
                    {...field}
                    value={field.value ?? ""}
                    id="eco-target"
                    aria-invalid={fieldState.invalid}
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
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
                  <FieldLabel htmlFor="eco-expected">
                    Fecha estimada{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <DatePicker
                    id="eco-expected"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    placeholder="Sin fecha"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="eco-notes">
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="eco-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Link del producto"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </DialogClose>
          <Button
            disabled={isPending}
            form="edit-custody-order-form"
            type="submit"
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
