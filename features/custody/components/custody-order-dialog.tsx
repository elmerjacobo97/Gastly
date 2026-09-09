'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon, PlusIcon } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { type Resolver, Controller, useForm } from 'react-hook-form';

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
import { custodyOrderSchema, type CustodyOrderValues } from '@/features/custody/schemas/custody-schemas';
import { createCustodyOrder } from '@/features/custody/server/actions';

const defaultValues: CustodyOrderValues = {
  personName: '',
  title: '',
  targetAmount: undefined,
  expectedOn: '',
  notes: '',
};

type CustodyOrderDialogProps = {
  triggerLabel?: string;
};

export function CustodyOrderDialog({ triggerLabel = 'Nuevo encargo' }: CustodyOrderDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const form = useForm<CustodyOrderValues>({
    resolver: zodResolver(custodyOrderSchema) as Resolver<CustodyOrderValues>,
    defaultValues,
  });

  function onSubmit(values: CustodyOrderValues) {
    startTransition(async () => {
      try {
        await createCustodyOrder(values);
        toast.success('Encargo registrado');
        form.reset(defaultValues);
        setOpen(false);
      } catch (error) {
        toast.error('No se pudo registrar el encargo', {
          description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">{triggerLabel}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo encargo</DialogTitle>
          <DialogDescription>
            Registra dinero en custodia de otra persona para llevar un historial claro.
          </DialogDescription>
        </DialogHeader>
        <form
          id="custody-order-form"
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
                  <FieldLabel htmlFor="co-person">Persona</FieldLabel>
                  <Input {...field} id="co-person" aria-invalid={fieldState.invalid} placeholder="Ej: María López" />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="title"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="co-title">Propósito</FieldLabel>
                  <Input
                    {...field}
                    id="co-title"
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
                  <FieldLabel htmlFor="co-target">
                    Monto objetivo (PEN) <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <NumberInput
                    {...field}
                    value={field.value ?? ''}
                    id="co-target"
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
                  <FieldLabel htmlFor="co-expected">
                    Fecha estimada <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <DatePicker
                    id="co-expected"
                    value={field.value ?? ''}
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
                  <FieldLabel htmlFor="co-notes">
                    Notas <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="co-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Link del producto, acuerdos"
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
          <Button disabled={isPending} form="custody-order-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Registrar encargo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
