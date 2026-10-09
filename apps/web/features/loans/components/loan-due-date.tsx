import { dueSoonLabel, getLoanDue } from "@/features/loans/lib/loan-due";
import { formatDate } from "@/lib/format";

type LoanDueDateProps = {
  expectedOn: string | null;
  isSettled: boolean;
};

export function LoanDueDate({ expectedOn, isSettled }: LoanDueDateProps) {
  if (!expectedOn || isSettled) return null;

  const due = getLoanDue(expectedOn, new Date());
  const date = formatDate(expectedOn);

  if (due.status === "overdue") {
    return <span className="text-xs font-medium text-destructive">{date}</span>;
  }

  if (due.status === "soon") {
    return (
      <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
        {dueSoonLabel(due.days)} · {date}
      </span>
    );
  }

  return <span className="text-xs text-muted-foreground">{date}</span>;
}
