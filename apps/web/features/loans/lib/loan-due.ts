import { differenceInCalendarDays, parseISO } from "date-fns";

const SOON_DAYS = 7;

export type LoanDue = {
  status: "overdue" | "soon" | "ok";
  days: number;
};

export function getLoanDue(expectedOn: string, today: Date): LoanDue {
  const days = differenceInCalendarDays(parseISO(expectedOn), today);
  if (days < 0) return { status: "overdue", days };
  if (days <= SOON_DAYS) return { status: "soon", days };
  return { status: "ok", days };
}

export function dueSoonLabel(days: number) {
  if (days === 0) return "Vence hoy";
  if (days === 1) return "Vence mañana";
  return `Vence en ${days} días`;
}
