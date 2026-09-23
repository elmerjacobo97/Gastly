import { addDays, dateInTimeZone, daysBetween, monthRange } from "./date.ts";

Deno.test("dateInTimeZone uses Lima local date, not the UTC date", () => {
  const instant = new Date("2026-09-23T02:00:00.000Z");
  if (dateInTimeZone(instant, "America/Lima") !== "2026-09-22") {
    throw new Error("Expected Lima date to remain on September 22");
  }
});

Deno.test("date helpers handle month ends and leap years", () => {
  if (addDays("2026-01-31", 1) !== "2026-02-01") {
    throw new Error("Expected January 31 to advance to February 1");
  }
  if (addDays("2028-02-28", 1) !== "2028-02-29") {
    throw new Error("Expected leap day to be included");
  }
  if (daysBetween("2026-02-28", "2026-03-02") !== 2) {
    throw new Error("Expected date-only difference to be timezone independent");
  }
  const february = monthRange("2026-02-28");
  if (
    february.start !== "2026-02-01" ||
    february.endExclusive !== "2026-03-01"
  ) {
    throw new Error("Expected a half-open February range");
  }
});
