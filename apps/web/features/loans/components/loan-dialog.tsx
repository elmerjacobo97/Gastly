"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { type Resolver, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoanFormFields } from "@/features/loans/components/loan-form-fields";
import { normalizePersonName } from "@/features/loans/lib/group-loans";
import {
  loanSchema,
  type LoanValues,
} from "@/features/loans/schemas/loan-schemas";
import { createLoan } from "@/features/loans/server/actions";
import { type Loan } from "@/features/loans/types/loan-types";

function getTodayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

const EMPTY_DEFAULTS: LoanValues = {
  direction: "lent",
  personName: "",
  amount: 0,
  currency: "PEN",
  interestRate: 0,
  description: "",
  expectedOn: "",
  loanedOn: getTodayStr(),
  isSale: false,
};

type LoanDialogProps = {
  triggerLabel?: string;
  loans: Loan[];
  defaultPersonName?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function LoanDialog({
  triggerLabel = "Registrar préstamo",
  loans,
  defaultPersonName = "",
  open: controlledOpen,
  onOpenChange,
}: LoanDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const personNames = [
    ...new Map(
      loans.map((loan) => [
        normalizePersonName(loan.personName),
        loan.personName,
      ]),
    ).values(),
  ];

  const form = useForm<LoanValues>({
    resolver: zodResolver(loanSchema) as Resolver<LoanValues>,
    defaultValues: { ...EMPTY_DEFAULTS, personName: defaultPersonName },
  });

  function setOpen(next: boolean) {
    if (next) {
      form.reset({
        ...EMPTY_DEFAULTS,
        personName: defaultPersonName,
        loanedOn: getTodayStr(),
      });
    }
    if (!isControlled) setInternalOpen(next);
    onOpenChange?.(next);
  }

  const direction = useWatch({ control: form.control, name: "direction" });
  const personName = useWatch({ control: form.control, name: "personName" });
  const currency = useWatch({ control: form.control, name: "currency" });

  const matchingBalance = loans.find(
    (loan) =>
      loan.direction === direction &&
      loan.currency === currency &&
      normalizePersonName(loan.personName) ===
        normalizePersonName(personName ?? ""),
  );

  function onSubmit(values: LoanValues) {
    startTransition(async () => {
      try {
        await createLoan(values);
        toast.success(
          matchingBalance
            ? "Monto sumado al saldo existente"
            : "Préstamo registrado",
        );
        setOpen(false);
      } catch (error) {
        toast.error("No se pudo registrar el préstamo", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger render={<Button />}>
          <PlusIcon data-icon="inline-start" />
          <span className="hidden sm:inline">{triggerLabel}</span>
        </DialogTrigger>
      )}
      <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar préstamo</DialogTitle>
          <DialogDescription>
            Anota dinero que prestas o que te prestan. Si la persona ya existe,
            se suma a su saldo.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="-mx-4 min-h-0">
          <div className="px-4 pb-1">
            <form
              id="loan-form"
              className="flex flex-col gap-5"
              noValidate
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <LoanFormFields
                control={form.control}
                setValue={form.setValue}
                personNames={personNames}
                matchingBalance={matchingBalance}
              />
            </form>
          </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancelar
          </DialogClose>
          <Button disabled={isPending} form="loan-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Registrar préstamo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
