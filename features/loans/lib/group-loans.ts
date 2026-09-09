import {
  type Loan,
  type LoanHistoryEntry,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types"

export function normalizePersonName(name: string) {
  return name.trim().toLowerCase()
}

export function groupLoansByPerson(loans: Loan[]): LoanPersonGroup[] {
  const groups = new Map<string, LoanPersonGroup>()

  for (const loan of loans) {
    const key = `${loan.direction}:${normalizePersonName(loan.personName)}`
    const existing = groups.get(key)
    if (existing) {
      existing.balances.push(loan)
      existing.isSettled = existing.isSettled && loan.isSettled
      continue
    }
    groups.set(key, {
      key,
      personName: loan.personName,
      direction: loan.direction,
      balances: [loan],
      isSettled: loan.isSettled,
    })
  }

  return [...groups.values()]
}

export function uniquePersonNames(loans: Loan[]) {
  const names = new Set<string>()
  for (const loan of loans) {
    names.add(loan.personName)
  }
  return [...names].toSorted((a, b) => a.localeCompare(b, "es"))
}

export function historyEntriesForGroup(group: LoanPersonGroup): LoanHistoryEntry[] {
  const entries: LoanHistoryEntry[] = []

  for (const loan of group.balances) {
    for (const disbursement of loan.disbursements) {
      entries.push({
        id: disbursement.id,
        kind: "disbursement",
        loanId: loan.id,
        currency: loan.currency,
        amount: disbursement.amount,
        occurredOn: disbursement.occurredOn,
        notes: disbursement.notes,
      })
    }
    for (const payment of loan.payments) {
      entries.push({
        id: payment.id,
        kind: "payment",
        loanId: loan.id,
        currency: loan.currency,
        amount: payment.amount,
        occurredOn: payment.occurredOn,
        notes: payment.notes,
      })
    }
  }

  return entries.toSorted((a, b) => {
    const byDate = b.occurredOn.localeCompare(a.occurredOn)
    if (byDate !== 0) return byDate
    return a.kind.localeCompare(b.kind)
  })
}

export function earliestLoanedOn(group: LoanPersonGroup) {
  let earliest = group.balances[0]?.loanedOn ?? ""
  for (const loan of group.balances) {
    if (loan.loanedOn < earliest) earliest = loan.loanedOn
  }
  return earliest
}
