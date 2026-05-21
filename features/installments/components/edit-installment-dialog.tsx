'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2Icon } from 'lucide-react';
import { useEffect } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getCategories } from '@/features/categories/lib/categories-api';
import {
  installmentPurchaseSchema,
  type InstallmentPurchaseValues,
} from '@/features/installments/schemas/installment-schemas';
import { updateInstallmentPurchase } from '@/features/installments/lib/installments-api';
import { type InstallmentPurchase } from '@/features/installments/types/installment-types';

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
  const queryClient = useQueryClient();
  const canEditFinancials = purchase.paidCount === 0;

  const form = useForm<InstallmentPurchaseValues>({
    resolver: zodResolver(installmentPurchaseSchema),
    defaultValues: {
      description: purchase.description,
      categoryId: purchase.category?.id ?? '',
      totalAmount: Math.round(purchase.installmentAmount * purchase.totalInstallments * 100) / 100,
      totalInstallments: purchase.totalInstallments,
      firstPaymentOn: purchase.firstPaymentOn,
      alreadyPaid: 0 as number,
      notes: purchase.notes ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        description: purchase.description,
        categoryId: purchase.category?.id ?? '',
        totalAmount: Math.round(purchase.installmentAmount * purchase.totalInstallments * 100) / 100,
        totalInstallments: purchase.totalInstallments,
        firstPaymentOn: purchase.firstPaymentOn,
        alreadyPaid: 0 as number,
        notes: purchase.notes ?? '',
      });
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const categoriesQuery = useQuery({
    queryKey: ['categories', 'expense'],
    queryFn: () => getCategories('expense'),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (values: InstallmentPurchaseValues) =>
      updateInstallmentPurchase(purchase.id, values, purchase.paidCount),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['installments'] });
      onOpenChange(false);
      toast.success('Compra actualizada');
    },
    onError: (error) => {
      toast.error('No se pudo actualizar', { description: error.message });
    },
  });

  const totalAmount = useWatch({ control: form.control, name: 'totalAmount' });
  const totalInstallments = useWatch({ control: form.control, name: 'totalInstallments' });
  const firstPaymentOn = useWatch({ control: form.control, name: 'firstPaymentOn' });
  const alreadyPaid = useWatch({ control: form.control, name: 'alreadyPaid' });

  const installmentAmount =
    totalAmount > 0 && totalInstallments > 0 ? Math.round((totalAmount / totalInstallments) * 100) / 100 : 0;

  const lastPaymentLabel = getLastPaymentDate(firstPaymentOn, totalInstallments);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar compra en cuotas</DialogTitle>
          <DialogDescription>
            {canEditFinancials
              ? 'Sin pagos registrados — puedes editar todos los campos.'
              : 'Ya hay pagos registrados — solo puedes editar descripción, categoría y notas.'}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              id="edit-installment-form"
              className="flex flex-col gap-5"
              noValidate
              onSubmit={form.handleSubmit((v) => mutation.mutate(v as InstallmentPurchaseValues))}
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
                  <NativeSelect {...field} id="ei-category" aria-invalid={fieldState.invalid}>
                    <NativeSelectOption value="">Selecciona una categoría</NativeSelectOption>
                    {categoriesQuery.data?.map((c) => (
                      <NativeSelectOption key={c.id} value={c.id}>
                        {c.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
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
                    <FieldLabel htmlFor="ei-total">Monto total</FieldLabel>
                    <Input
                      {...field}
                      id="ei-total"
                      aria-invalid={fieldState.invalid}
                      type="number"
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
                name="totalInstallments"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="ei-count">Cuotas</FieldLabel>
                    <Input
                      {...field}
                      id="ei-count"
                      aria-invalid={fieldState.invalid}
                      type="number"
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
            </div>

            {installmentAmount > 0 && canEditFinancials && (
              <div className="rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Por cuota: </span>
                <span className="font-semibold">S/ {installmentAmount.toFixed(2)}</span>
                {lastPaymentLabel && <span className="text-muted-foreground"> · Último pago: {lastPaymentLabel}</span>}
              </div>
            )}

            <Controller
              control={form.control}
              name="firstPaymentOn"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="ei-first-payment">Fecha del primer pago</FieldLabel>
                  <Input
                    {...field}
                    id="ei-first-payment"
                    aria-invalid={fieldState.invalid}
                    type="date"
                    disabled={!canEditFinancials}
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
                    <Input
                      {...field}
                      id="ei-already-paid"
                      aria-invalid={fieldState.invalid}
                      type="number"
                      inputMode="numeric"
                      min="0"
                      placeholder="0"
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
          <Button disabled={mutation.isPending} form="edit-installment-form" type="submit">
            {mutation.isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
