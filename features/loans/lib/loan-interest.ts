export type InterestDisbursementInput = {
  id: string;
  amount: number;
  occurredOn: string;
  interestRate: number;
};

export type InterestPaymentInput = {
  id: string;
  disbursementId: string;
  amount: number;
  occurredOn: string;
};

export type LoanInterestSummary = {
  accruedInterest: number;
  outstandingPrincipal: number;
  totalDue: number;
  unappliedAmount: number;
  disbursements: { id: string; outstanding: number }[];
};

const MS_PER_DAY = 86_400_000;

type Bucket = {
  id: string;
  principal: number;
  interest: number;
  rate: number;
};

type InterestEvent =
  | { kind: "disbursement"; date: string; value: InterestDisbursementInput }
  | { kind: "payment"; date: string; value: InterestPaymentInput };

function toUtcDay(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

function daysBetween(from: string, to: string) {
  return Math.max(0, Math.round((toUtcDay(to) - toUtcDay(from)) / MS_PER_DAY));
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function sortEvents(events: InterestEvent[]) {
  return events.toSorted((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    if (a.kind === b.kind) return 0;
    return a.kind === "disbursement" ? -1 : 1;
  });
}

export function computeLoanInterest(
  disbursements: InterestDisbursementInput[],
  payments: InterestPaymentInput[],
  asOf: string,
): LoanInterestSummary {
  const events = sortEvents([
    ...disbursements.map((value): InterestEvent => ({
      kind: "disbursement",
      date: value.occurredOn,
      value,
    })),
    ...payments.map((value): InterestEvent => ({
      kind: "payment",
      date: value.occurredOn,
      value,
    })),
  ]).filter((event) => event.date <= asOf);

  const buckets: Bucket[] = [];
  let unappliedAmount = 0;
  let cursor = events[0]?.date ?? asOf;

  function accrue(to: string) {
    const days = daysBetween(cursor, to);
    if (days <= 0) return;
    for (const bucket of buckets) {
      if (bucket.principal <= 0 || bucket.rate <= 0) continue;
      const interest = bucket.principal * (bucket.rate / 100) * (days / 30);
      bucket.interest = round2(bucket.interest + interest);
    }
    cursor = to;
  }

  for (const event of events) {
    accrue(event.date);
    if (event.kind === "disbursement") {
      buckets.push({
        id: event.value.id,
        principal: event.value.amount,
        interest: 0,
        rate: event.value.interestRate,
      });
      continue;
    }

    const bucket = buckets.find(
      (item) => item.id === event.value.disbursementId,
    );
    if (!bucket) {
      unappliedAmount += event.value.amount;
      continue;
    }

    let remaining = event.value.amount;
    const interestPaid = Math.min(bucket.interest, remaining);
    bucket.interest = round2(bucket.interest - interestPaid);
    remaining = round2(remaining - interestPaid);
    const principalPaid = Math.min(bucket.principal, remaining);
    bucket.principal = round2(bucket.principal - principalPaid);
    remaining = round2(remaining - principalPaid);
    unappliedAmount += remaining;
  }

  accrue(asOf);

  let accruedInterest = 0;
  let outstandingPrincipal = 0;
  for (const bucket of buckets) {
    accruedInterest += bucket.interest;
    outstandingPrincipal += bucket.principal;
  }

  accruedInterest = round2(accruedInterest);
  outstandingPrincipal = round2(outstandingPrincipal);

  return {
    accruedInterest,
    outstandingPrincipal,
    totalDue: round2(outstandingPrincipal + accruedInterest),
    unappliedAmount: round2(unappliedAmount),
    disbursements: buckets.map((bucket) => ({
      id: bucket.id,
      outstanding: round2(bucket.principal + bucket.interest),
    })),
  };
}
