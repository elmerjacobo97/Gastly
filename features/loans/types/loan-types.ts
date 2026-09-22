export type LoanDirection = "lent" | "borrowed";

export const LOAN_CURRENCIES = ["PEN", "USD", "MXN"] as const;

export type LoanCurrency = (typeof LOAN_CURRENCIES)[number];

export const LOAN_CURRENCY_LABELS: Record<LoanCurrency, string> = {
  PEN: "Soles (PEN)",
  USD: "Dólares (USD)",
  MXN: "Pesos (MXN)",
};

export type LoanPayment = {
  id: string;
  loanId: string;
  disbursementId: string;
  amount: number;
  occurredOn: string;
  notes: string | null;
};

export type LoanDisbursement = {
  id: string;
  loanId: string;
  amount: number;
  occurredOn: string;
  description: string | null;
  notes: string | null;
  interestRate: number;
  outstandingAmount: number;
};

export type Loan = {
  id: string;
  personName: string;
  direction: LoanDirection;
  currency: LoanCurrency;
  expectedOn: string | null;
  notes: string | null;
  disbursements: LoanDisbursement[];
  payments: LoanPayment[];
  accruedInterest: number;
  pendingAmount: number;
  isSettled: boolean;
};

export type LoanPersonGroup = {
  key: string;
  personName: string;
  direction: LoanDirection;
  balances: Loan[];
  isSettled: boolean;
};

type LoanHistoryKind = "disbursement" | "payment";

export type LoanHistoryEntry = {
  id: string;
  kind: LoanHistoryKind;
  loanId: string;
  currency: LoanCurrency;
  amount: number;
  occurredOn: string;
  description: string | null;
  notes: string | null;
  interestRate: number;
};

export type LoanMovementRow = LoanHistoryEntry & {
  personName: string;
  direction: LoanDirection;
  isSettled: boolean;
  pendingAmount: number;
};
