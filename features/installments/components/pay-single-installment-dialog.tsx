'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
import { useTransition } from 'react';
import { toast } from 'sonner';
import { Controller, useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { DatePicker } from '@/components/ui/date-picker';
import { payMonthInstallments } from '@/features/installments/server/actions';
import { payInstallmentsSchema, type PayInstallmentsValues } from '@/features/installments/schemas/installment-schemas';
import { type InstallmentPayment, type InstallmentPurchase } from '@/features/installments/types/installment-types';
import { formatCurrency } from '@/lib/format';

type PaySingleInstallmentDialogProps = {
  payment: InstallmentPayment;
  purchase: InstallmentPurchase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PaySingleInstallmentDialog({ payment, purchase, open, onOpenChange }: PaySingleInstallmentDialogProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<PayInstallmentsValues>({
    resolver: zodResolver(payInstallmentsSchema),
    defaultValues: { occurredOn: payment.dueOn },
  });

  function onSubmit(values: PayInstallmentsValues) {
    startTransition(async () => {
      try {
        await payMonthInstallments([{ payment, purchase }], values.occurredOn);
        toast.success('Cuota registrada');
        form.reset({ occurredOn: payment.dueOn });
        onOpenChange(false);
      } catch (error) {
        toast.error('No se pudo registrar la cuota', {
          description: error instanceof Error ? error.message : 'Inténtalo de nuevo.',
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Registrar pago de cuota</DialogTitle>
          <DialogDescription>
            {purchase.description} · Cuota {payment.paymentNumber}/{purchase.totalInstallments} ·{' '}
            {formatCurrency(payment.amount)}
          </DialogDescription>
        </DialogHeader>
        <form id="pay-single-installment-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="occurredOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="psi-date">Fecha de pago</FieldLabel>
                  <DatePicker
                    id="psi-date"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
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
          <Button disabled={isPending} form="pay-single-installment-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
