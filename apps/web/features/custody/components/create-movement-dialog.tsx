"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
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
import { recordCustodyMovement } from "@/features/custody/server/actions";
import {
  type CustodyMovementType,
  type CustodyOrder,
} from "@/features/custody/types/custody-types";
import { formatCurrency } from "@/lib/format";

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function getDefaultValues(
  type: CustodyMovementType,
  balanceHeld: number,
): CustodyMovementValues {
  return {
    type,
    amount: type === "deposit" ? 0 : balanceHeld,
    occurredOn: getTodayStr(),
    method: type === "deposit" ? "yape" : undefined,
    notes: "",
  };
}

type CreateMovementDialogProps = {
  order: CustodyOrder;
  type?: CustodyMovementType;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateMovementDialog({
  order,
  type = "deposit",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: CreateMovementDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const [isPending, startTransition] = useTransition();

  const { id: orderId, balanceHeld, personName, title } = order;

  const defaults = useMemo(
    () => getDefaultValues(type, balanceHeld),
    [type, balanceHeld],
  );

  const form = useForm<CustodyMovementValues>({
    resolver: zodResolver(
      custodyMovementSchema,
    ) as Resolver<CustodyMovementValues>,
    defaultValues: defaults,
  });

  const selectedType = useWatch({ control: form.control, name: "type" });

  useEffect(() => {
    if (open) form.reset(defaults);
  }, [open, defaults, form]);

  function handleTypeChange(
    nextType: CustodyMovementType,
    onChange: (value: CustodyMovementType) => void,
  ) {
    const nextDefaults = getDefaultValues(nextType, balanceHeld);
    onChange(nextType);
    form.setValue("amount", nextDefaults.amount);
    form.setValue("method", nextDefaults.method);
  }

  function onSubmit(values: CustodyMovementValues) {
    startTransition(async () => {
      try {
        await recordCustodyMovement(orderId, values);
        toast.success("Movimiento registrado");
        setOpen(false);
      } catch (error) {
        toast.error("No se pudo registrar el movimiento", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar movimiento</DialogTitle>
          <DialogDescription>
            {personName} · {title} · En custodia: {formatCurrency(balanceHeld)}
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-custody-movement-form"
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
                  <NativeSelect
                    {...field}
                    id="cm-type"
                    onChange={(event) =>
                      handleTypeChange(
                        event.target.value as CustodyMovementType,
                        field.onChange,
                      )
                    }
                  >
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

            {selectedType === "deposit" && (
              <MovementMethodField control={form.control} />
            )}

            <MovementNotesField control={form.control} type={selectedType} />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancelar
          </DialogClose>
          <Button
            disabled={isPending}
            form="create-custody-movement-form"
            type="submit"
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
