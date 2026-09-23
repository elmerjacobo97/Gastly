"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { type Resolver, Controller, useForm } from "react-hook-form";

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
  DialogTrigger,
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
import { recordCustodyMovement } from "@/features/custody/server/actions";
import {
  type CustodyMovementType,
  type CustodyOrder,
} from "@/features/custody/types/custody-types";
import { formatCurrency } from "@/lib/format";

const METHOD_LABELS: Record<string, string> = {
  yape: "YAPE",
  plin: "PLIN",
  transfer: "Transferencia",
  cash: "Efectivo",
};

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
  trigger?: React.ReactNode;
};

export function CreateMovementDialog({
  order,
  type = "deposit",
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
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

  useEffect(() => {
    if (open) form.reset(defaults);
  }, [open, defaults, form]);

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
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {type === "deposit" ? "Registrar depósito" : "Registrar desembolso"}
          </DialogTitle>
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

            {type === "deposit" && (
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
                      type === "deposit"
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

export function DepositButton({ order }: { order: CustodyOrder }) {
  return (
    <CreateMovementDialog
      order={order}
      type="deposit"
      trigger={
        <Button variant="outline" size="sm">
          <ArrowDownIcon data-icon="inline-start" />
          Depósito
        </Button>
      }
    />
  );
}

export function DisbursementButton({ order }: { order: CustodyOrder }) {
  return (
    <CreateMovementDialog
      order={order}
      type="disbursement"
      trigger={
        <Button variant="outline" size="sm">
          <ArrowUpIcon data-icon="inline-start" />
          Desembolso
        </Button>
      }
    />
  );
}

export { METHOD_LABELS };
