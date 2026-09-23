import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getNextPaymentDefault } from "@/features/installments/lib/installment-date-utils";

function setToday(year: number, month: number, day: number) {
  vi.setSystemTime(new Date(year, month - 1, day, 12, 0, 0));
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("getNextPaymentDefault", () => {
  it("returns the 20th of the current month before the 20th", () => {
    setToday(2026, 1, 10);
    expect(getNextPaymentDefault()).toBe("2026-01-20");
  });

  it("returns the 20th of the current month on the 20th", () => {
    setToday(2026, 1, 20);
    expect(getNextPaymentDefault()).toBe("2026-01-20");
  });

  it("returns the 20th of the next month after the 20th", () => {
    setToday(2026, 1, 21);
    expect(getNextPaymentDefault()).toBe("2026-02-20");
  });

  it("handles the first day of a month", () => {
    setToday(2026, 3, 1);
    expect(getNextPaymentDefault()).toBe("2026-03-20");
  });

  it("handles the last day of a 31 day month", () => {
    setToday(2026, 1, 31);
    expect(getNextPaymentDefault()).toBe("2026-02-20");
  });

  it("handles the last day of a 30 day month", () => {
    setToday(2026, 4, 30);
    expect(getNextPaymentDefault()).toBe("2026-05-20");
  });

  it("crosses the year boundary in December", () => {
    setToday(2025, 12, 20);
    expect(getNextPaymentDefault()).toBe("2025-12-20");

    setToday(2025, 12, 21);
    expect(getNextPaymentDefault()).toBe("2026-01-20");

    setToday(2025, 12, 31);
    expect(getNextPaymentDefault()).toBe("2026-01-20");
  });

  it("keeps the day at 20 in February", () => {
    setToday(2026, 2, 21);
    expect(getNextPaymentDefault()).toBe("2026-03-20");
  });
});
