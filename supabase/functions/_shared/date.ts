const DAY_MS = 24 * 60 * 60 * 1000;

export function dateInTimeZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((value) => value.type === type)?.value;

  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) throw new Error("Could not format local date");
  return `${year}-${month}-${day}`;
}

export function addDays(date: string, days: number): string {
  const [year, month, day] = date.split("-").map(Number);
  const result = new Date(Date.UTC(year, month - 1, day + days));
  return result.toISOString().slice(0, 10);
}

export function daysBetween(startDate: string, endDate: string): number {
  const parse = (date: string) => {
    const [year, month, day] = date.split("-").map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((parse(endDate) - parse(startDate)) / DAY_MS);
}

export function monthRange(date: string): {
  monthKey: string;
  start: string;
  endExclusive: string;
} {
  const [year, month] = date.split("-").map(Number);
  const nextMonth = new Date(Date.UTC(year, month, 1));
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;
  return {
    monthKey,
    start: `${monthKey}-01`,
    endExclusive: nextMonth.toISOString().slice(0, 10),
  };
}
