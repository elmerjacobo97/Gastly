import { differenceInCalendarDays, format, parseISO } from "date-fns";

export type DateTone = "overdue" | "soon" | "done" | "muted";

const DUE_SOON_DAYS = 7;

export function dueTone(
  dueOn: string,
  todayStr = format(new Date(), "yyyy-MM-dd"),
): DateTone {
  const days = differenceInCalendarDays(parseISO(dueOn), parseISO(todayStr));
  if (days < 0) return "overdue";
  if (days <= DUE_SOON_DAYS) return "soon";
  return "muted";
}
