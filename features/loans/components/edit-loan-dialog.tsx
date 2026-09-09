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
import {
  editLoanPersonSchema,
  type EditLoanPersonValues,
} from "@/features/loans/schemas/loan-schemas"
import { updateLoanPerson } from "@/features/loans/server/actions"
import { type LoanPersonGroup } from "@/features/loans/types/loan-types"

type EditLoanDialogProps = {
  group: LoanPersonGroup
  open: boolean
  onOpenChange: (open: boolean) => void
}

function defaultsFromGroup(group: LoanPersonGroup): EditLoanPersonValues {
  const expectedOn = group.balances.find((loan) => loan.expectedOn)?.expectedOn ?? ""
  const notes = group.balances.find((loan) => loan.notes)?.notes ?? ""
  return {
    personName: group.personName,
    expectedOn,
    notes,
  }
}

export function EditLoanDialog({ group, open, onOpenChange }: EditLoanDialogProps) {
  const form = useForm<EditLoanPersonValues>({
    resolver: zodResolver(editLoanPersonSchema) as Resolver<EditLoanPersonValues>,
    defaultValues: defaultsFromGroup(group),
  })

  useEffect(() => {
    if (open) form.reset(defaultsFromGroup(group))
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const [isPending, startTransition] = useTransition()

  function onSubmit(values: EditLoanPersonValues) {
    startTransition(async () => {
      try {
        await updateLoanPerson(
          group.balances.map((loan) => loan.id),
          values
        )
        toast.success("Préstamo actualizado")
        onOpenChange(false)
      } catch (error) {
        toast.error("No se pudo actualizar el préstamo", {
          description: error instanceof Error ? error.message : "Inténtalo de nuevo.",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar préstamo</DialogTitle>
          <DialogDescription>
            Cambia el nombre o las notas. Los montos se editan en el historial.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-loan-form"
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
                  <FieldLabel htmlFor="el-person">
                    {group.direction === "lent" ? "A quién le presté" : "Quién me prestó"}
                  </FieldLabel>
                  <Input
                    {...field}
                    id="el-person"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Juan García"
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
                  <FieldLabel htmlFor="el-expected-on">
                    Devolución esperada{" "}
                    <span className="font-normal text-muted-foreground">(opc.)</span>
                  </FieldLabel>
                  <DatePicker
                    id="el-expected-on"
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
                  <FieldLabel htmlFor="el-notes">
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="el-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Para emergencia médica"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={isPending} form="edit-loan-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
