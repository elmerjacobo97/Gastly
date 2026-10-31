"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";
import { type Resolver, Controller, useForm } from "react-hook-form";

import { ColorPicker } from "@/components/color-picker";
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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { Textarea } from "@/components/ui/textarea";
import {
  ACCOUNT_COLORS,
  accountUpdateSchema,
  type AccountUpdateValues,
} from "@/features/accounts/schemas/account-schemas";
import { updateAccount } from "@/features/accounts/server/actions";
import { type Account } from "@/lib/account-types";
import { CURRENCY_LABELS } from "@/lib/format";

type EditAccountDialogProps = {
  account: Account;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditAccountDialog({
  account,
  open,
  onOpenChange,
}: EditAccountDialogProps) {
  const { name, balance, color, notes } = account;

  const defaults = useMemo(
    () => ({ name, balance, color, notes: notes ?? "" }),
    [name, balance, color, notes],
  );

  const form = useForm<AccountUpdateValues>({
    resolver: zodResolver(accountUpdateSchema) as Resolver<AccountUpdateValues>,
    defaultValues: defaults,
    values: defaults,
  });

  const [isPending, startTransition] = useTransition();

  function onSubmit(values: AccountUpdateValues) {
    startTransition(async () => {
      try {
        await updateAccount(account.id, values);
        toast.success("Cuenta actualizada");
        onOpenChange(false);
      } catch (error) {
        toast.error("No se pudo actualizar la cuenta", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar cuenta</DialogTitle>
          <DialogDescription>
            Moneda: {CURRENCY_LABELS[account.currency]}. No se puede cambiar.
          </DialogDescription>
        </DialogHeader>
        <form
          id="edit-account-form"
          className="flex flex-col gap-4"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-account-name">Nombre</FieldLabel>
                  <Input
                    {...field}
                    id="edit-account-name"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="balance"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="edit-account-balance">
                    Saldo ({account.currency})
                  </FieldLabel>
                  <NumberInput
                    {...field}
                    id="edit-account-balance"
                    inputMode="decimal"
                    step="0.01"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="color"
              render={({ field }) => (
                <Field>
                  <FieldLabel>Color</FieldLabel>
                  <ColorPicker
                    options={ACCOUNT_COLORS}
                    value={field.value}
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
                  <FieldLabel htmlFor="edit-account-notes">Notas</FieldLabel>
                  <Textarea
                    {...field}
                    id="edit-account-notes"
                    placeholder="Opcional"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" type="button" />}>
            Cancelar
          </DialogClose>
          <Button disabled={isPending} form="edit-account-form" type="submit">
            {isPending && <Loader2Icon className="size-4 animate-spin" />}
            Guardar cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
