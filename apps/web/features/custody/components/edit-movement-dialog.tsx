"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  custodyMovementSchema,
  type CustodyMovementValues,
} from "@/features/custody/schemas/custody-schemas";
import {
  MovementAmountDateFields,
  MovementMethodField,
  MovementNotesField,
} from "@/features/custody/components/movement-form-fields";
import { updateCustodyMovement } from "@/features/custody/server/actions";
import {
  type CustodyMovement,
  type CustodyOrder,
} from "@/features/custody/types/custody-types";

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

            <MovementAmountDateFields control={form.control} />

            {movementType === "deposit" && (
              <MovementMethodField control={form.control} />
            )}

            <MovementNotesField control={form.control} type={movementType} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancelar
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
