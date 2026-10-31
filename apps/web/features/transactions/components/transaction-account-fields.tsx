"use client";

import { type Control, Controller, useWatch } from "react-hook-form";

import { AccountSelect } from "@/components/account-select";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { NumberInput } from "@/components/ui/number-input";
import { type TransactionValues } from "@/features/transactions/schemas/transaction-schemas";
import { type Account } from "@/lib/account-types";

type TransactionAccountFieldsProps = {
  control: Control<TransactionValues>;
  accounts: Account[];
  idPrefix: string;
};

export function getAccountForAmount(
  accounts: Account[],
  values: Pick<TransactionValues, "accountId" | "currency">,
) {
  const account = accounts.find((a) => a.id === values.accountId);
  return account && account.currency !== values.currency ? account : null;
}

export function TransactionAccountFields({
  control,
  accounts,
  idPrefix,
}: TransactionAccountFieldsProps) {
  const accountId = useWatch({ control, name: "accountId" });
  const currency = useWatch({ control, name: "currency" });
  const foreignAccount = getAccountForAmount(accounts, { accountId, currency });

  return (
    <>
      <Controller
        control={control}
        name="accountId"
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-account`}>
              Cuenta <span className="text-muted-foreground">(opcional)</span>
            </FieldLabel>
            <AccountSelect
              id={`${idPrefix}-account`}
              accounts={accounts}
              value={field.value ?? ""}
              onChange={field.onChange}
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
      {foreignAccount && (
        <Controller
          control={control}
          name="accountAmount"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${idPrefix}-account-amount`}>
                Monto en {foreignAccount.currency}
              </FieldLabel>
              <NumberInput
                {...field}
                aria-invalid={fieldState.invalid}
                id={`${idPrefix}-account-amount`}
                inputMode="decimal"
                min="0"
                step="0.01"
              />
              <FieldDescription>
                {foreignAccount.name} está en {foreignAccount.currency}. Ingresa
                lo que se movió en esa cuenta.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      )}
    </>
  );
}
