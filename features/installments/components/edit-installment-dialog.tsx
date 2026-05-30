'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { addMonths, format, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { DatePicker } from '@/components/ui/date-picker';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CategorySelect } from '@/features/categories/components/category-select';
import {
  installmentPurchaseSchema,
  type InstallmentPurchaseValues,
} from '@/features/installments/schemas/installment-schemas';
import { useUpdateInstallmentPurchase } from '@/features/installments/hooks/mutations';
import { getNextPaymentDefault } from '@/features/installments/lib/installment-date-utils';
import { type InstallmentPurchase } from '@/features/installments/types/installment-types';
import { AccountSelect } from '@/features/accounts/components/account-select';

function getLastPaymentDate(firstPaymentOn: string, totalInstallments: number): string | null {
  if (!firstPaymentOn || !totalInstallments || totalInstallments < 2) return null;
  try {
    const first = new Date(`${firstPaymentOn}T12:00:00`);
    return format(addMonths(first, totalInstallments - 1), 'MMMM yyyy', { locale: es });
  } catch {
    return null;
  }
}

type EditInstallmentDialogProps = {
  purchase: InstallmentPurchase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditInstallmentDialog({ purchase, open, onOpenChange }: EditInstallmentDialogProps) {
  const trackedPaidCount = purchase.payments.filter((p) => !!p.transactionId).length;
  const canEditFinancials = trackedPaidCount === 0;
  const externallyPaidCount = purchase.payments.filter((p) => p.paidExternally).length;

  const form = useForm<InstallmentPurchaseValues>({
    resolver: zodResolver(installmentPurchaseSchema),
    defaultValues: {
      description: purchase.description,
      categoryId: purchase.category?.id ?? '',
      totalAmount: Math.round((purchase.installmentAmount * purchase.totalInstallments - purchase.interestAmount) * 100) / 100,
      interestAmount: purchase.interestAmount,
      totalInstallments: purchase.totalInstallments,
      firstPaymentOn: purchase.firstPaymentOn,
      alreadyPaid: externallyPaidCount,
      accountId: purchase.accountId ?? '',
      notes: purchase.notes ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        description: purchase.description,
        categoryId: purchase.category?.id ?? '',
        totalAmount: Math.round((purchase.installmentAmount * purchase.totalInstallments - purchase.interestAmount) * 100) / 100,
        interestAmount: purchase.interestAmount,
        totalInstallments: purchase.totalInstallments,
        firstPaymentOn: purchase.firstPaymentOn,
        alreadyPaid: externallyPaidCount,
        accountId: purchase.accountId ?? '',
        notes: purchase.notes ?? '',
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const mutation = useUpdateInstallmentPurchase(purchase.id, trackedPaidCount);

  const totalAmount = useWatch({ control: form.control, name: 'totalAmount' });
  const interestAmount = useWatch({ control: form.control, name: 'interestAmount' });
  const totalInstallments = useWatch({ control: form.control, name: 'totalInstallments' });
  const firstPaymentOn = useWatch({ control: form.control, name: 'firstPaymentOn' });
  const alreadyPaid = useWatch({ control: form.control, name: 'alreadyPaid' });

  const interest = Number(interestAmount) || 0;
  const total = (Number(totalAmount) || 0) + interest;
  const installmentAmount =
    total > 0 && totalInstallments > 0 ? Math.round((total / totalInstallments) * 100) / 100 : 0;
  const lastPaymentLabel = getLastPaymentDate(firstPaymentOn, totalInstallments);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar compra en cuotas</DialogTitle>
          <DialogDescription>
            {canEditFinancials
              ? 'Sin pagos registrados en app — puedes editar todos los campos.'
              : 'Ya hay pagos registrados — solo puedes editar descripción, categoría, cuenta y notas.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              id="edit-installment-form"
              className="flex flex-col gap-5"
              noValidate
              onSubmit={form.handleSubmit((v) => mutation.mutate(v as InstallmentPurchaseValues, { onSuccess: () => onOpenChange(false) }))}
            >
              <FieldGroup>
            <Controller
              control={form.control}
              name="description"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ei-description">Descripción</FieldLabel>
                  <Input
                    {...field}
                    id="ei-description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Camisa Mercado Libre"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="categoryId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ei-category">Categoría</FieldLabel>
                  <CategorySelect
                    id="ei-category"
                    value={field.value}
                    onChange={field.onChange}
                    type="expense"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="totalAmount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ei-total">Precio original</FieldLabel>
                    <NumberInput
                      {...field}
                      id="ei-total"
                      aria-invalid={fieldState.invalid}
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={!canEditFinancials}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="interestAmount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ei-interest">
                      Intereses <span className="font-normal text-muted-foreground">(opc.)</span>
                    </FieldLabel>
                    <NumberInput
                      {...field}
                      id="ei-interest"
                      aria-invalid={fieldState.invalid}
                      inputMode="decimal"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      disabled={!canEditFinancials}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Controller
                control={form.control}
                name="totalInstallments"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ei-count">Cuotas</FieldLabel>
                    <NumberInput
                      {...field}
                      id="ei-count"
                      aria-invalid={fieldState.invalid}
                      inputMode="numeric"
                      min="2"
                      max="60"
                      placeholder="6"
                      disabled={!canEditFinancials}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel>Total a pagar</FieldLabel>
                <Input
                  readOnly
                  disabled
                  value={total > 0 ? `S/ ${total.toFixed(2)}` : ''}
                  placeholder="—"
                  className="tabular-nums"
                />
              </Field>
            </div>

            {installmentAmount > 0 && canEditFinancials && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Por cuota: </span>
                <span className="font-semibold">S/ {installmentAmount.toFixed(2)}</span>
                {interest > 0 && (
                  <span className="text-muted-foreground"> · Intereses: S/ {interest.toFixed(2)}</span>
                )}
                {lastPaymentLabel && <span className="text-muted-foreground"> · Último pago: {lastPaymentLabel}</span>}
              </div>
            )}

            <Controller
              control={form.control}
              name="firstPaymentOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ei-first-payment">Fecha del primer pago</FieldLabel>
                  <DatePicker
                    id="ei-first-payment"
                    value={field.value}
                    onChange={field.onChange}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {canEditFinancials && (
              <Controller
                control={form.control}
                name="alreadyPaid"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ei-already-paid">
                      Cuotas ya pagadas{' '}
                      <span className="font-normal text-muted-foreground">(para compras en curso)</span>
                    </FieldLabel>
                    <NumberInput
                      {...field}
                      id="ei-already-paid"
                      aria-invalid={fieldState.invalid}
                      inputMode="numeric"
                      min="0"
                      placeholder="0"
                      onChange={(e) => {
                        field.onChange(e);
                        const paid = Number((e.target as HTMLInputElement).value) || 0;
                        const nextPayment = new Date(`${getNextPaymentDefault()}T12:00:00`);
                        form.setValue('firstPaymentOn', format(subMonths(nextPayment, paid), 'yyyy-MM-dd'));
                      }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    {totalInstallments > 0 && (alreadyPaid ?? 0) > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Quedan {totalInstallments - (alreadyPaid ?? 0)} cuota
                        {totalInstallments - (alreadyPaid ?? 0) !== 1 ? 's' : ''} por pagar.
                      </p>
                    )}
                  </Field>
                )}
              />
            )}

            <Controller
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor="ei-account">
                    Cuenta de débito <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <AccountSelect
                    id="ei-account"
                    value={field.value ?? ""}
                    onChange={field.onChange}
                  />
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="notes"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ei-notes">
                    Notas <span className="font-normal text-muted-foreground">(opcional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="ei-notes"
                    aria-invalid={fieldState.invalid}
                    placeholder="Ej: Comprado en Saga, sin intereses"
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
              </FieldGroup>
            </form>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">Cancelar</Button>
          </DialogClose>
          <Button disabled={mutation.isPending} form="edit-installment-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
