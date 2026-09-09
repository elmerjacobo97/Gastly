import { createAuthedClient } from "../supabase-client.js"
import { hasFlag } from "../flags.js"
import { formatCurrency, writeJson, writeLine } from "../format.js"
import type {
  LoanSummary,
  InstallmentPurchaseRecord,
  CustodyOrderRecord,
  RecurringPaymentRecord,
} from "../types.js"

type DebtsOutput = {
  loansBorrowed: LoanSummary[]
  loansLent: LoanSummary[]
  installments: InstallmentPurchaseRecord[]
  custody: CustodyOrderRecord[]
  recurring: RecurringPaymentRecord[]
}

export async function runDebts(args: string[]): Promise<void> {
  if (hasFlag(args, "--help") || hasFlag(args, "-h")) {
    process.stdout.write(`Usage:\n  gastly-cli debts [--json]\n\nShow all debts: loans, installments, custody holdings, and recurring payments for the current month.\n`)
    return
  }

  const json = hasFlag(args, "--json")
  const { supabase } = await createAuthedClient()

  // Loans
  const { data: loanRows, error: loanError } = await supabase
    .from("loans")
    .select("id, person_name, direction, currency, amount, expected_on, loaned_on, notes")
    .order("created_at", { ascending: false })

  if (loanError) throw new Error(loanError.message)

  const loanIds = (loanRows ?? []).map((l) => l.id)

  const disbursementsByLoan = new Map<string, { amount: number }[]>()
  const paymentsByLoan = new Map<string, { amount: number }[]>()

  if (loanIds.length > 0) {
    const { data: disbursements } = await supabase
      .from("loan_disbursements")
      .select("loan_id, amount")
      .in("loan_id", loanIds)

    const { data: payments } = await supabase
      .from("loan_payments")
      .select("loan_id, amount")
      .in("loan_id", loanIds)

    for (const d of disbursements ?? []) {
      const list = disbursementsByLoan.get(d.loan_id) ?? []
      list.push({ amount: Number(d.amount) })
      disbursementsByLoan.set(d.loan_id, list)
    }

    for (const p of payments ?? []) {
      const list = paymentsByLoan.get(p.loan_id) ?? []
      list.push({ amount: Number(p.amount) })
      paymentsByLoan.set(p.loan_id, list)
    }
  }

  const loanSummaries: LoanSummary[] = (loanRows ?? []).map((row) => {
    const disbursements = disbursementsByLoan.get(row.id) ?? []
    const payments = paymentsByLoan.get(row.id) ?? []
    const totalAmount = disbursements.reduce((s, d) => s + d.amount, 0)
    const paidAmount = payments.reduce((s, p) => s + p.amount, 0)
    const pendingAmount = Math.max(0, totalAmount - paidAmount)
    return {
      id: row.id,
      personName: row.person_name,
      direction: row.direction as "lent" | "borrowed",
      currency: row.currency,
      totalAmount,
      paidAmount,
      pendingAmount,
      isSettled: pendingAmount <= 0,
      expectedOn: row.expected_on,
    }
  })

  const loansBorrowed = loanSummaries.filter((l) => l.direction === "borrowed" && !l.isSettled)
  const loansLent = loanSummaries.filter((l) => l.direction === "lent" && !l.isSettled)

  // Installments
  const { data: purchaseRows, error: purchaseError } = await supabase
    .from("installment_purchases")
    .select("id, description, installment_amount, total_installments")
    .order("created_at", { ascending: false })

  if (purchaseError) throw new Error(purchaseError.message)

  const purchaseIds = (purchaseRows ?? []).map((p) => p.id)
  const paymentsByPurchase = new Map<string, { amount: number; transaction_id: string | null; paid_externally: boolean }[]>()

  if (purchaseIds.length > 0) {
    const { data: instPayments } = await supabase
      .from("installment_payments")
      .select("purchase_id, amount, transaction_id, paid_externally")
      .in("purchase_id", purchaseIds)

    for (const p of instPayments ?? []) {
      const list = paymentsByPurchase.get(p.purchase_id) ?? []
      list.push({
        amount: Number(p.amount),
        transaction_id: p.transaction_id,
        paid_externally: p.paid_externally,
      })
      paymentsByPurchase.set(p.purchase_id, list)
    }
  }

  const installments: InstallmentPurchaseRecord[] = (purchaseRows ?? [])
    .map((row) => {
      const payments = paymentsByPurchase.get(row.id) ?? []
      const paid = payments.filter((p) => p.transaction_id || p.paid_externally)
      const pending = payments.filter((p) => !p.transaction_id && !p.paid_externally)
      return {
        id: row.id,
        description: row.description,
        installmentAmount: Number(row.installment_amount),
        totalInstallments: row.total_installments,
        pendingCount: pending.length,
        totalPaid: paid.reduce((s, p) => s + p.amount, 0),
        totalPending: pending.reduce((s, p) => s + p.amount, 0),
      }
    })
    .filter((p) => p.pendingCount > 0)

  // Custody
  const { data: orderRows, error: orderError } = await supabase
    .from("custody_orders")
    .select("id, person_name, title, status")
    .order("created_at", { ascending: false })

  if (orderError) throw new Error(orderError.message)

  const orderIds = (orderRows ?? []).map((o) => o.id)
  const movementsByOrder = new Map<string, { type: string; amount: number }[]>()

  if (orderIds.length > 0) {
    const { data: movements } = await supabase
      .from("custody_movements")
      .select("custody_order_id, type, amount")
      .in("custody_order_id", orderIds)

    for (const m of movements ?? []) {
      const list = movementsByOrder.get(m.custody_order_id) ?? []
      list.push({ type: m.type, amount: Number(m.amount) })
      movementsByOrder.set(m.custody_order_id, list)
    }
  }

  const custody: CustodyOrderRecord[] = (orderRows ?? [])
    .map((row) => {
      const movements = movementsByOrder.get(row.id) ?? []
      const totalDeposited = movements
        .filter((m) => m.type === "deposit")
        .reduce((s, m) => s + m.amount, 0)
      const totalDisbursed = movements
        .filter((m) => m.type === "disbursement")
        .reduce((s, m) => s + m.amount, 0)
      const balanceHeld = totalDeposited - totalDisbursed
      return {
        id: row.id,
        personName: row.person_name,
        title: row.title,
        status: row.status,
        totalDeposited,
        totalDisbursed,
        balanceHeld,
        isSettled: balanceHeld <= 0,
      }
    })
    .filter((o) => !o.isSettled)

  // Recurring payments (current month)
  const now = new Date()
  const year = now.getFullYear()
  const mo = now.getMonth() + 1
  const monthStart = `${year}-${String(mo).padStart(2, "0")}-01`
  const lastDay = new Date(year, mo, 0).getDate()
  const monthEnd = `${year}-${String(mo).padStart(2, "0")}-${lastDay}`

  const { data: recurringRows, error: recurringError } = await supabase
    .from("recurring_expenses")
    .select("id, amount, description, frequency, next_due_on, is_active, type")
    .eq("is_active", true)
    .eq("type", "expense")
    .order("next_due_on", { ascending: true })

  if (recurringError) throw new Error(recurringError.message)

  const recurringIds = (recurringRows ?? []).map((r) => r.id)
  const paidByRecurring = new Map<string, number>()

  if (recurringIds.length > 0) {
    const { data: recurringTxs } = await supabase
      .from("transactions")
      .select("recurring_expense_id, amount")
      .in("recurring_expense_id", recurringIds)
      .gte("occurred_on", monthStart)
      .lte("occurred_on", monthEnd)

    for (const tx of recurringTxs ?? []) {
      if (tx.recurring_expense_id) {
        const current = paidByRecurring.get(tx.recurring_expense_id) ?? 0
        paidByRecurring.set(tx.recurring_expense_id, current + Number(tx.amount))
      }
    }
  }

  const recurring: RecurringPaymentRecord[] = (recurringRows ?? []).map((row) => ({
    id: row.id,
    description: row.description,
    amount: Number(row.amount),
    frequency: row.frequency,
    nextDueOn: row.next_due_on,
    isActive: row.is_active,
    type: row.type as "expense" | "income",
    paidAmount: paidByRecurring.get(row.id) ?? null,
  }))

  const output: DebtsOutput = {
    loansBorrowed,
    loansLent,
    installments,
    custody,
    recurring,
  }

  if (json) {
    writeJson(output)
  } else {
    // Loans borrowed
    writeLine("\n=== Loans: I OWE (borrowed) ===")
    if (loansBorrowed.length === 0) {
      writeLine("  No pending borrowed loans.")
    } else {
      const grouped = groupByCurrency(loansBorrowed)
      for (const [currency, loans] of grouped) {
        const total = loans.reduce((s, l) => s + l.pendingAmount, 0)
        for (const loan of loans) {
          writeLine(
            `  ${loan.personName.padEnd(20)} ${formatCurrency(loan.pendingAmount, currency).padStart(14)}` +
              (loan.expectedOn ? ` (due: ${loan.expectedOn})` : ""),
          )
        }
        writeLine(`  ${"TOTAL".padEnd(20)} ${formatCurrency(total, currency).padStart(14)}`)
      }
    }

    // Loans lent
    writeLine("\n=== Loans: THEY OWE ME (lent) ===")
    if (loansLent.length === 0) {
      writeLine("  No pending lent loans.")
    } else {
      const grouped = groupByCurrency(loansLent)
      for (const [currency, loans] of grouped) {
        const total = loans.reduce((s, l) => s + l.pendingAmount, 0)
        for (const loan of loans) {
          writeLine(
            `  ${loan.personName.padEnd(20)} ${formatCurrency(loan.pendingAmount, currency).padStart(14)}` +
              (loan.expectedOn ? ` (due: ${loan.expectedOn})` : ""),
          )
        }
        writeLine(`  ${"TOTAL".padEnd(20)} ${formatCurrency(total, currency).padStart(14)}`)
      }
    }

    // Installments
    writeLine("\n=== Installments (pending) ===")
    if (installments.length === 0) {
      writeLine("  No pending installments.")
    } else {
      for (const inst of installments) {
        writeLine(
          `  ${inst.description.padEnd(25)} ${inst.pendingCount} pending  ${formatCurrency(inst.totalPending).padStart(12)}`,
        )
      }
    }

    // Custody
    writeLine("\n=== Custody (held for others) ===")
    if (custody.length === 0) {
      writeLine("  No active custody orders.")
    } else {
      for (const order of custody) {
        writeLine(
          `  ${order.personName.padEnd(20)} ${order.title.padEnd(20)} ${formatCurrency(order.balanceHeld).padStart(14)}`,
        )
      }
    }

    // Recurring
    writeLine("\n=== Recurring Payments (this month) ===")
    if (recurring.length === 0) {
      writeLine("  No active recurring expenses.")
    } else {
      for (const rec of recurring) {
        const paid = rec.paidAmount != null ? ` (paid: ${formatCurrency(rec.paidAmount)})` : ""
        writeLine(
          `  ${rec.description.padEnd(25)} ${formatCurrency(rec.amount).padStart(12)}${paid}`,
        )
      }
    }
  }
}

function groupByCurrency(loans: LoanSummary[]): Map<string, LoanSummary[]> {
  const map = new Map<string, LoanSummary[]>()
  for (const loan of loans) {
    const list = map.get(loan.currency) ?? []
    list.push(loan)
    map.set(loan.currency, list)
  }
  return map
}
