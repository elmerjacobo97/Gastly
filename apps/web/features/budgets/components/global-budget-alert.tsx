import { AlertTriangleIcon, OctagonAlertIcon } from "lucide-react";
import Link from "next/link";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { type GlobalBudgetAlert as GlobalBudgetAlertData } from "@/features/budgets/types/budget-types";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

type GlobalBudgetAlertProps = {
  alert: GlobalBudgetAlertData;
};

export function GlobalBudgetAlert({ alert }: GlobalBudgetAlertProps) {
  const { currency, limit, used, percentage, remaining, isOverBudget } = alert;
  const Icon = isOverBudget ? OctagonAlertIcon : AlertTriangleIcon;

  return (
    <Alert
      variant={isOverBudget ? "destructive" : "warning"}
      className={cn(
        "sticky top-14 z-10 rounded-none border-x-0 border-t-0",
        isOverBudget
          ? "bg-red-50 dark:bg-red-950"
          : "bg-amber-50 dark:bg-amber-950",
      )}
    >
      <Icon />
      <AlertTitle>
        {isOverBudget
          ? `Excediste el límite global por ${formatCurrency(-remaining, currency)}`
          : `Llevas el ${percentage}% del límite global`}
      </AlertTitle>
      <AlertDescription>
        {formatCurrency(used, currency)} de {formatCurrency(limit, currency)}
        {isOverBudget ? "" : ` · quedan ${formatCurrency(remaining, currency)}`}
        {" · "}
        <Link href="/budgets" className="underline underline-offset-3">
          Ver presupuestos
        </Link>
      </AlertDescription>
    </Alert>
  );
}
