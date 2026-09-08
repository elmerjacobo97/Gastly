'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2Icon } from 'lucide-react';
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
import { usePaySingleInstallment } from '@/lib/finance/installments/hooks/mutations';
import { payInstallmentsSchema, type PayInstallmentsValues } from '@/lib/finance/installments/schemas/installment-schemas';
import { type InstallmentPayment, type InstallmentPurchase } from '@/lib/finance/installments/types/installment-types';
import { formatCurrency } from '@/lib/format';

type PaySingleInstallmentDialogProps = {
  payment: InstallmentPayment;
  purchase: InstallmentPurchase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PaySingleInstallmentDialog({ payment, purchase, open, onOpenChange }: PaySingleInstallmentDialogProps) {
  const form = useForm<PayInstallmentsValues>({
    resolver: zodResolver(payInstallmentsSchema),
    defaultValues: { occurredOn: payment.dueOn },
  });

  const mutation = usePaySingleInstallment(payment, purchase);

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
        <form id="pay-single-installment-form" noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v, { onSuccess: () => { form.reset({ occurredOn: payment.dueOn }); onOpenChange(false); } }))}>
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
          <Button disabled={mutation.isPending} form="pay-single-installment-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Confirmar pago
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
