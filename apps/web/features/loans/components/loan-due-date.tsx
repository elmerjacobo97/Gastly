import { DateCell } from "@/components/date-cell";
import { dueTone } from "@/lib/due-tone";

type LoanDueDateProps = {
  expectedOn: string | null;
  isSettled: boolean;
};

export function LoanDueDate({ expectedOn, isSettled }: LoanDueDateProps) {
  if (!expectedOn || isSettled) return null;

  return (
    <DateCell
      value={expectedOn}
      tone={dueTone(expectedOn)}
      className="text-xs"
    />
  );
}
