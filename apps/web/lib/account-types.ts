import { type CurrencyCode } from "@/lib/format";

export type Account = {
  id: string;
  name: string;
  currency: CurrencyCode;
  balance: number;
  color: string;
  notes: string | null;
  createdAt: string;
};
