import { describe, expect, it } from "vitest";

import { dateInTimeZone, escapeIcsText, foldIcsLine } from "@/lib/ics";

describe("ICS formatting helpers", () => {
  it("escapes punctuation and all line break forms", () => {
    expect(escapeIcsText("a,b;c\\d\r\ne\rf\ng")).toBe(
      "a\\,b\\;c\\\\d\\ne\\nf\\ng",
    );
  });

  it("folds long lines at UTF-8 boundaries within 75 octets", () => {
    const folded = foldIcsLine(`SUMMARY:${"é🙂".repeat(40)}`);
    const physicalLines = folded.split("\r\n");
    expect(physicalLines.length).toBeGreaterThan(1);
    expect(
      physicalLines.every(
        (line) => new TextEncoder().encode(line).length <= 75,
      ),
    ).toBe(true);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"é🙂".repeat(40)}`);
  });

  it("uses the requested timezone for date-only values", () => {
    expect(
      dateInTimeZone(new Date("2026-09-23T02:00:00.000Z"), "America/Lima"),
    ).toBe("2026-09-22");
  });
});
