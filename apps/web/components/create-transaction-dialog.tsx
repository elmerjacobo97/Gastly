"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { type Resolver, Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { TransactionCategoryField } from "@/components/transaction-category-field";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuickCreateCategoryDialog } from "@/components/quick-create-category-dialog";
import { type Account } from "@/lib/account-types";
import { type Category } from "@/lib/category-types";
import {
  TransactionAmountFields,
  TransactionDateField,
  TransactionNotesField,
} from "@/features/transactions/components/transaction-form-fields";
import { TransactionAccountFields } from "@/features/transactions/components/transaction-account-fields";
import { getAccountForAmount } from "@/features/transactions/lib/account-amount";
import { MIN_DESCRIPTION_LENGTH } from "@/features/transactions/lib/category-suggestion";
import { createTransaction } from "@/features/transactions/server/actions";
import { suggestCategory } from "@/features/transactions/server/suggest-category";
import { type TransactionType } from "@/lib/transaction-types";
import {
  type TransactionValues,
  transactionSchema,
} from "@/features/transactions/schemas/transaction-schemas";

type CreateTransactionDialogProps = {
  categories: Category[];
  accounts: Account[];
  defaultType?: TransactionType;
  lockType?: boolean;
  triggerLabel?: string;
  trigger?: React.ReactElement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialValues?: Partial<TransactionValues>;
  onSuccess?: () => void;
};

function getToday() {
  return format(new Date(), "yyyy-MM-dd");
}

function buildDefaultValues(
  defaultType: TransactionType,
  initialValues: Partial<TransactionValues> = {},
): TransactionValues {
  return {
    type: defaultType,
    amount: 0,
    currency: "PEN",
    description: "",
    categoryName: "",
    occurredOn: getToday(),
    notes: "",
    accountId: "",
    ...initialValues,
  };
}

export function CreateTransactionDialog({
  categories,
  accounts,
  defaultType = "expense",
  lockType = false,
  triggerLabel = "Nueva transacción",
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialValues,
  onSuccess,
}: CreateTransactionDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isSuggesting, setIsSuggesting] = useState(false);
  const autoSuggestedRef = useRef(false);
  const suggestionRequestRef = useRef(0);
  const lastSuggestionKeyRef = useRef("");
  const isControlled = controlledOpen !== undefined;
  const open = controlledOpen ?? internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  const form = useForm<TransactionValues>({
    resolver: zodResolver(transactionSchema) as Resolver<TransactionValues>,
    defaultValues: buildDefaultValues(defaultType, initialValues),
  });

  const currentType = useWatch({
    control: form.control,
    name: "type",
  }) as TransactionType;

  const existingCategories = categories.filter((c) => c.type === currentType);

  // A category the user picked is never overwritten; one we suggested is replaced on the next description.
  function canApplySuggestion() {
    return !form.getValues("categoryName") || autoSuggestedRef.current;
  }

  async function suggestCategoryFromDescription(description: string) {
    if (description.trim().length < MIN_DESCRIPTION_LENGTH) return;
    if (!canApplySuggestion()) return;

    const key = `${form.getValues("type")}:${description.trim().toLowerCase()}`;
    if (
      key === lastSuggestionKeyRef.current &&
      form.getValues("categoryName")
    ) {
      return;
    }
    lastSuggestionKeyRef.current = key;

    const requestId = ++suggestionRequestRef.current;
    setIsSuggesting(true);
    const name = await suggestCategory(
      description,
      form.getValues("type"),
    ).catch(() => null);
    if (requestId !== suggestionRequestRef.current) return;

    setIsSuggesting(false);
    if (name && canApplySuggestion()) {
      autoSuggestedRef.current = true;
      form.setValue("categoryName", name, { shouldValidate: true });
    }
  }

  function setCategoryManually(name: string) {
    autoSuggestedRef.current = false;
    form.setValue("categoryName", name, { shouldValidate: true });
  }

  function onSubmit(values: TransactionValues) {
    const foreignAccount = getAccountForAmount(accounts, values);
    if (foreignAccount && !values.accountAmount) {
      form.setError("accountAmount", {
        message: `Ingresa el monto en ${foreignAccount.currency}.`,
      });
      return;
    }

    startTransition(async () => {
      try {
        await createTransaction({
          ...values,
          accountAmount: foreignAccount ? values.accountAmount : undefined,
        });
        toast.success("Transacción registrada");
        form.reset(buildDefaultValues(defaultType));
        setOpen(false);
        onSuccess?.();
      } catch (error) {
        toast.error("No se pudo registrar la transacción", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  const defaultTrigger = (
    <Button>
      <PlusIcon data-icon="inline-start" />
      <span className="hidden sm:inline">{triggerLabel}</span>
    </Button>
  );

  return (
    <>
      <QuickCreateCategoryDialog
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        defaultType={currentType}
        onCreated={(_id, name) => setCategoryManually(name)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        {!isControlled && <DialogTrigger render={trigger ?? defaultTrigger} />}
        <DialogContent className="max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva transacción</DialogTitle>
            <DialogDescription>
              Registra un ingreso o gasto para mantener tu balance al día.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="-mx-4 min-h-0">
            <div className="px-4 pb-1">
              <form
                className="flex flex-col gap-5"
                id="create-transaction-form"
                noValidate
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FieldGroup>
                  <TransactionAmountFields
                    control={form.control}
                    idPrefix="ct"
                    lockType={lockType}
                  />
                  <Controller
                    control={form.control}
                    name="description"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="ct-description">
                          Descripción
                        </FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id="ct-description"
                          onBlur={() => {
                            field.onBlur();
                            void suggestCategoryFromDescription(field.value);
                          }}
                          placeholder="Ej. Almuerzo, sueldo de mayo"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    control={form.control}
                    name="categoryName"
                    render={({ field, fieldState }) => (
                      <div className="flex flex-col gap-2">
                        <TransactionCategoryField
                          categories={existingCategories}
                          value={field.value}
                          invalid={fieldState.invalid}
                          error={fieldState.error}
                          onChange={setCategoryManually}
                          onCreate={() => setQuickCreateOpen(true)}
                        />
                        {isSuggesting && (
                          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                            <Loader2Icon className="size-3 animate-spin" />
                            Sugiriendo categoría…
                          </p>
                        )}
                      </div>
                    )}
                  />
                  <TransactionDateField control={form.control} idPrefix="ct" />
                  <TransactionAccountFields
                    control={form.control}
                    accounts={accounts}
                    idPrefix="ct"
                  />
                  <TransactionNotesField control={form.control} idPrefix="ct" />
                </FieldGroup>
              </form>
            </div>
          </ScrollArea>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              Cancelar
            </DialogClose>
            <Button
              disabled={isPending}
              form="create-transaction-form"
              type="submit"
            >
              {isPending && (
                <Loader2Icon className="mr-2 size-4 animate-spin" />
              )}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
