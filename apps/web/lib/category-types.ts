import { type TransactionType } from "@/lib/transaction-types";

export type Category = {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
  createdAt?: string;
};
