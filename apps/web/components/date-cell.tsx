import { type DateTone } from "@/lib/due-tone";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<DateTone, string> = {
  overdue: "text-destructive",
  soon: "text-amber-700 dark:text-amber-400",
  done: "text-emerald-700 dark:text-emerald-400",
  muted: "text-muted-foreground",
};

type DateCellProps = {
  value: string | null;
  tone?: DateTone;
  className?: string;
};

export function DateCell({ value, tone = "muted", className }: DateCellProps) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  return (
    <span className={cn("tabular-nums", TONE_CLASSES[tone], className)}>
      {formatDate(value)}
    </span>
  );
}
