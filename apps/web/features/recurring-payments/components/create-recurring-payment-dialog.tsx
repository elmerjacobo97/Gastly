"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RecurringPaymentFormFields } from "@/features/recurring-payments/components/recurring-payment-form-fields";
import { createRecurringPayment } from "@/features/recurring-payments/server/actions";
import { type Account } from "@/lib/account-types";
import { type Category } from "@/lib/category-types";
import {
  recurringPaymentSchema,
  type RecurringPaymentValues,
} from "@/features/recurring-payments/schemas/recurring-payment-schemas";

function buildDefaultValues(): RecurringPaymentValues {
  return {
    description: "",
    amount: 0,
    currency: "PEN",
    categoryId: "",
    frequency: "monthly",
    intervalMonths: 2,
    paymentKind: "fixed",
    nextDueOn: format(new Date(), "yyyy-MM-dd"),
    accountId: "",
    notes: "",
    type: "expense",
  };
}

type CreateRecurringPaymentDialogProps = {
  accounts: Account[];
  categories: Category[];
};

export function CreateRecurringPaymentDialog({
  accounts,
  categories,
}: CreateRecurringPaymentDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<RecurringPaymentValues>({
    resolver: zodResolver(
      recurringPaymentSchema,
    ) as Resolver<RecurringPaymentValues>,
    defaultValues: buildDefaultValues(),
  });

  function onSubmit(values: RecurringPaymentValues) {
    startTransition(async () => {
      try {
        await createRecurringPayment(values);
        toast.success("Pago recurrente creado");
        form.reset(buildDefaultValues());
        setOpen(false);
        router.refresh();
      } catch (error) {
        toast.error("No se pudo crear el pago recurrente", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon data-icon="inline-start" />
        <span className="hidden sm:inline">Nuevo pago recurrente</span>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo pago recurrente</DialogTitle>
          <DialogDescription>
            Registra pagos recurrentes con monto estimado. El monto real se
            define al pagar.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              className="flex flex-col gap-5"
              id="create-recurring-payment-form"
              noValidate
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <RecurringPaymentFormFields
                control={form.control}
                accounts={accounts}
                categories={categories}
                idPrefix="crp"
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
            form="create-recurring-payment-form"
            type="submit"
          >
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar pago recurrente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
