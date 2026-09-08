'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { ArrowDownIcon, ArrowUpIcon, Loader2Icon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type Resolver, Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { custodyMovementSchema, type CustodyMovementValues } from '@/lib/finance/custody/schemas/custody-schemas';
import { useRecordCustodyMovement, useUpdateCustodyMovement } from '@/lib/finance/custody/hooks/mutations';
import {
  type CustodyMovement,
  type CustodyMovementType,
  type CustodyOrder,
} from '@/lib/finance/custody/types/custody-types';
import { formatCurrency } from '@/lib/format';

const METHOD_LABELS: Record<string, string> = {
  yape: 'YAPE',
  plin: 'PLIN',
  transfer: 'Transferencia',
  cash: 'Efectivo',
};

function getTodayStr() {
  return format(new Date(), 'yyyy-MM-dd');
}

function getDefaultValues(
  type: CustodyMovementType,
  order?: CustodyOrder,
  movement?: CustodyMovement
): CustodyMovementValues {
  if (movement) {
    return {
      type: movement.type,
      amount: movement.amount,
      occurredOn: movement.occurredOn,
      method: movement.method ?? undefined,
      notes: movement.notes ?? '',
    };
  }

  return {
    type,
    amount: type === 'deposit' ? 0 : (order?.balanceHeld ?? 0),
    occurredOn: getTodayStr(),
    method: type === 'deposit' ? 'yape' : undefined,
    notes: '',
  };
}

type RecordMovementDialogProps = {
  order: CustodyOrder;
  type?: CustodyMovementType;
  movement?: CustodyMovement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
};

export function RecordMovementDialog({
  order,
  type = 'deposit',
  movement,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: RecordMovementDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;
  const isEdit = Boolean(movement);

  const form = useForm<CustodyMovementValues>({
    resolver: zodResolver(custodyMovementSchema) as Resolver<CustodyMovementValues>,
    defaultValues: getDefaultValues(type, order, movement),
  });

  const movementType = useWatch({ control: form.control, name: 'type' });
  const createMutation = useRecordCustodyMovement(order.id);
  const updateMutation = useUpdateCustodyMovement(movement?.id ?? '');
  const mutation = isEdit ? updateMutation : createMutation;

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(type, order, movement));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const title =
    movementType === 'deposit'
      ? isEdit
        ? 'Editar depósito'
        : 'Registrar depósito'
      : isEdit
        ? 'Editar desembolso'
        : 'Registrar desembolso';

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {order.personName} · {order.title}
            {!isEdit && <> · En custodia: {formatCurrency(order.balanceHeld)}</>}
          </DialogDescription>
        </DialogHeader>
        <form
          id="custody-movement-form"
          className="flex flex-col gap-5"
          noValidate
          onSubmit={form.handleSubmit((v) =>
            mutation.mutate(v, {
              onSuccess: () => {
                form.reset(getDefaultValues(type, order));
                setOpen(false);
              },
            })
          )}
        >
          <FieldGroup>
            {isEdit && (
              <Controller
                control={form.control}
                name="type"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="cm-type">Tipo</FieldLabel>
                    <NativeSelect {...field} id="cm-type">
                      <NativeSelectOption value="deposit">Depósito</NativeSelectOption>
                      <NativeSelectOption value="disbursement">Desembolso</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                )}
              />
            )}

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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
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
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            {movementType === 'deposit' && (
              <Controller
                control={form.control}
                name="method"
                render={({ field }) => (
                  <Field>
                    <FieldLabel htmlFor="cm-method">Método</FieldLabel>
                    <NativeSelect {...field} id="cm-method" value={field.value ?? 'yape'}>
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
                    Notas <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="cm-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder={movementType === 'deposit' ? 'Ej: Operación YAPE #123' : 'Ej: Compra en tienda X'}
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
          <Button disabled={mutation.isPending} form="custody-movement-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            {isEdit ? 'Guardar cambios' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return dialog;
}

export function DepositButton({ order }: { order: CustodyOrder }) {
  return (
    <RecordMovementDialog
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
    <RecordMovementDialog
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
