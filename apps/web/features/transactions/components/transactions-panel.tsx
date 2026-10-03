import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Badge } from "@/components/ui/badge";
import { CreditCardDebtCard } from "@/features/transactions/components/credit-card-debt-card";
import { DashboardCharts } from "@/features/transactions/components/dashboard-charts";
import { DashboardSummaryCards } from "@/features/transactions/components/dashboard-summary-cards";
import { UpcomingPaymentsCard } from "@/features/transactions/components/upcoming-payments-card";
import { getMonthInstallments } from "@/lib/installments-calcs";
import { computeSummary } from "@/features/transactions/lib/transactions-api";
import {
  type CategoryTotal,
  type MonthlyTotal,
} from "@/features/transactions/server/charts-queries";
import { type Transaction } from "@/lib/transaction-types";
import { type RecurringPayment } from "@/lib/recurring-payment-types";
import { type InstallmentPurchase } from "@/lib/installment-types";

type TransactionsPanelProps = {
  userEmail?: string;
  userName?: string;
  transactions: Transaction[];
  unpaidCreditCard: Transaction[];
  recurringPayments: RecurringPayment[];
  installments: InstallmentPurchase[];
  monthlyData?: MonthlyTotal[];
  categoryData?: CategoryTotal[];
};

function isRelevantForMonth(payment: RecurringPayment, monthKey: string) {
  if (!payment.isActive) return false;
  if (payment.frequency === "monthly") return true;
  return (
    payment.nextDueOn.startsWith(monthKey) ||
    payment.paidOn?.startsWith(monthKey)
  );
}

function getDaysUntil(date: string) {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const diffMs =
    new Date(`${date}T12:00:00`).getTime() -
    new Date(`${todayStr}T12:00:00`).getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function TransactionsPanel({
  userEmail,
  userName,
  transactions,
  unpaidCreditCard,
  recurringPayments: allRecurring,
  installments,
  monthlyData,
  categoryData,
}: TransactionsPanelProps) {
  const today = new Date();
  const monthKey = format(today, "yyyy-MM");
  const monthLabel = format(today, "MMMM yyyy", { locale: es });
  const displayName = userName || userEmail?.split("@")[0] || "Usuario";

  const summary = computeSummary(transactions);
  const incomeMovementCount = transactions.filter(
    (transaction) => transaction.type === "income",
  ).length;
  const expenseMovementCount = transactions.filter(
    (transaction) => transaction.type === "expense",
  ).length;

  const recurringPayments = allRecurring.filter(
    (p) => p.type === "expense" && isRelevantForMonth(p, monthKey),
  );

  const monthInstallments = getMonthInstallments(installments, today);
  const recurringPendingPayments = recurringPayments.filter(
    (payment) => payment.paidOn === null,
  );
  const installmentPendingPayments = monthInstallments.filter(
    ({ payment }) => !payment.transactionId && !payment.paidExternally,
  );
  const recurringPendingTotal = recurringPendingPayments
    .filter((payment) => payment.currency === "PEN")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const installmentsPendingTotal = installmentPendingPayments.reduce(
    (sum, { payment }) => sum + payment.amount,
    0,
  );
  const totalToPay = recurringPendingTotal + installmentsPendingTotal;
  const pendingPaymentCount =
    recurringPendingPayments.length + installmentPendingPayments.length;

  const upcomingPayments = recurringPayments
    .map((payment) => ({
      expense: payment,
      days: getDaysUntil(payment.nextDueOn),
    }))
    .sort((a, b) => a.days - b.days)
    .slice(0, 8);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1.5">
          <Badge className="w-fit capitalize" variant="secondary">
            {monthLabel}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Hola, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground">
            Resumen de tus finanzas de este mes.
          </p>
        </div>
      </section>

      <DashboardSummaryCards
        monthlyIncome={summary.income}
        monthlyExpenses={summary.expenses}
        monthlyBalance={summary.balance}
        totalToPay={totalToPay}
        incomeMovementCount={incomeMovementCount}
        expenseMovementCount={expenseMovementCount}
        pendingPaymentCount={pendingPaymentCount}
      />

      <UpcomingPaymentsCard payments={upcomingPayments} />

      <CreditCardDebtCard transactions={unpaidCreditCard} />

      <DashboardCharts monthlyData={monthlyData} categoryData={categoryData} />
    </main>
  );
}
