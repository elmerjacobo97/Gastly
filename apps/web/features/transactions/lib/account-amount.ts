import { type TransactionValues } from "@/features/transactions/schemas/transaction-schemas";
import { type Account } from "@/lib/account-types";

// The account when it holds another currency than the transaction, so its own amount is needed.
export function getAccountForAmount(
  accounts: Account[],
  values: Pick<TransactionValues, "accountId" | "currency">,
) {
  const account = accounts.find((a) => a.id === values.accountId);
  return account && account.currency !== values.currency ? account : null;
}
