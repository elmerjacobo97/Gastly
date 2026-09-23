export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\r\n|\r|\n/g, "\\n");
}

/** Fold an iCalendar content line without splitting a UTF-8 code point. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let currentBytes = 0;
  let maxBytes = 75;

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    if (currentBytes + characterBytes > maxBytes) {
      parts.push(current);
      current = ` ${character}`;
      currentBytes = 1 + characterBytes;
      maxBytes = 75;
    } else {
      current += character;
      currentBytes += characterBytes;
    }
  }

  if (current) parts.push(current);
  return parts.join("\r\n");
}

export function formatCurrency(amount: number, currency = "PEN"): string {
  try {
    return new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

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
