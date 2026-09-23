"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  custodyMovementSchema,
  type CustodyMovementValues,
} from "@/features/custody/schemas/custody-schemas";
import { updateCustodyMovement } from "@/features/custody/server/actions";
import {
  type CustodyMovement,
  type CustodyOrder,
} from "@/features/custody/types/custody-types";
import { METHOD_LABELS } from "@/features/custody/components/create-movement-dialog";

type EditMovementDialogProps = {
  order: CustodyOrder;
  movement: CustodyMovement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditMovementDialog({
  order,
  movement,
  open,
  onOpenChange,
}: EditMovementDialogProps) {
  const [isPending, startTransition] = useTransition();

  const { type, amount, occurredOn, method, notes } = movement;

  const defaults = useMemo(
    () => ({
      type,
      amount,
      occurredOn,
      method: method ?? undefined,
      notes: notes ?? "",
    }),
    [type, amount, occurredOn, method, notes],
  );

  const form = useForm<CustodyMovementValues>({
    resolver: zodResolver(
      custodyMovementSchema,
    ) as Resolver<CustodyMovementValues>,
    defaultValues: defaults,
    values: defaults,
  });

  const movementType = useWatch({ control: form.control, name: "type" });

  function onSubmit(values: CustodyMovementValues) {
    startTransition(async () => {
      try {
        await updateCustodyMovement(movement.id, values);
        toast.success("Movimiento actualizado");
        onOpenChange(false);
      } catch (error) {
        toast.error("No se pudo actualizar el movimiento", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {movementType === "deposit"
              ? "Editar depósito"
              : "Editar desembolso"}
          </DialogTitle>
          <DialogDescription>
            {order.personName} · {order.title}
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-custody-movement-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="type"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="cm-type">Tipo</FieldLabel>
                  <NativeSelect {...field} id="cm-type">
                    <NativeSelectOption value="deposit">
                      Depósito
                    </NativeSelectOption>
                    <NativeSelectOption value="disbursement">
                      Desembolso
                    </NativeSelectOption>
                  </NativeSelect>
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="cm-amount">Monto</FieldLabel>
                    <NumberInput
                      {...field}
                      id="cm-amount"
                      aria-invalid={fieldState.invalid}
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                    />
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
                    <FieldLabel htmlFor="cm-date">Fecha</FieldLabel>
                    <DatePicker
                      id="cm-date"
                      value={field.value}
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {movementType === "deposit" && (
              <Controller
                control={form.control}
                name="method"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="cm-method">Método</FieldLabel>
                    <NativeSelect
                      {...field}
                      id="cm-method"
                      value={field.value ?? "yape"}
                    >
                      {Object.entries(METHOD_LABELS).map(([value, label]) => (
                        <NativeSelectOption key={value} value={value}>
                          {label}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
              />
            )}

            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="cm-notes">
                    Notas{" "}
                    <span className="font-normal text-muted-foreground">
                      (opcional)
                    </span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="cm-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder={
                      movementType === "deposit"
                        ? "Ej: Operación YAPE #123"
                        : "Ej: Compra en tienda X"
                    }
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
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
            form="edit-custody-movement-form"
            type="submit"
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
