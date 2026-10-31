"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useTransition } from "react";
import { type Resolver, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecurringPaymentFormFields } from "@/features/recurring-payments/components/recurring-payment-form-fields";
import { updateRecurringPayment } from "@/features/recurring-payments/server/actions";
import { type Account } from "@/lib/account-types";
import { type Category } from "@/lib/category-types";
import {
  recurringPaymentSchema,
  type RecurringPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas";
import { type RecurringPayment } from "@/lib/recurring-payment-types";

type EditRecurringPaymentDialogProps = {
  payment: RecurringPayment;
  accounts: Account[];
  categories: Category[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditRecurringPaymentDialog({
  payment,
  accounts,
  categories,
  open,
  onOpenChange,
}: EditRecurringPaymentDialogProps) {
  const {
    description,
    amount,
    currency: paymentCurrency,
    category,
    frequency: paymentFrequency,
    intervalMonths,
    paymentKind,
    nextDueOn,
    accountId,
    notes,
    type: paymentType,
  } = payment;
  const categoryId = category?.id ?? "";

  const defaults = useMemo(
    () => ({
      description,
      amount,
      currency: paymentCurrency,
      categoryId,
      frequency: paymentFrequency,
      intervalMonths: intervalMonths ?? 2,
      paymentKind,
      nextDueOn,
      accountId: accountId ?? "",
      notes: notes ?? "",
      type: paymentType,
    }),
    [
      description,
      amount,
      paymentCurrency,
      categoryId,
      paymentFrequency,
      intervalMonths,
      paymentKind,
      nextDueOn,
      accountId,
      notes,
      paymentType,
    ],
  );

  const form = useForm<RecurringPaymentValues>({
    resolver: zodResolver(
      recurringPaymentSchema,
    ) as Resolver<RecurringPaymentValues>,
    defaultValues: defaults,
    values: defaults,
  });

  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(values: RecurringPaymentValues) {
    startTransition(async () => {
      try {
        await updateRecurringPayment(payment.id, values);
        toast.success("Pago recurrente actualizado");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        toast.error("No se pudo actualizar el pago recurrente", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar pago recurrente</DialogTitle>
          <DialogDescription>
            Modifica los datos del pago recurrente.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              className="flex flex-col gap-5"
              id="edit-recurring-payment-form"
              noValidate
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <RecurringPaymentFormFields
                control={form.control}
                accounts={accounts}
                categories={categories}
                idPrefix="erp"
              />
            </form>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancelar
          </DialogClose>
          <Button
            disabled={isPending}
            form="edit-recurring-payment-form"
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
