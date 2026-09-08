import { createClient } from "@/lib/supabase/server"
import {
  type CustodyMovement,
  type CustodyOrder,
  type CustodyOrderStatus,
  type CustodyPaymentMethod,
} from "@/lib/finance/custody/types/custody-types"

type CustodyMovementRowDb = {
  id: string
  custody_order_id: string
  type: "deposit" | "disbursement"
  amount: number | string
  occurred_on: string
  method: CustodyPaymentMethod | null
  notes: string | null
}

type CustodyOrderRow = {
  id: string
  person_name: string
  title: string
  target_amount: number | string | null
  expected_on: string | null
  status: CustodyOrderStatus
  notes: string | null
  created_at: string
}

function mapMovement(row: CustodyMovementRowDb): CustodyMovement {
  return {
    id: row.id,
    custodyOrderId: row.custody_order_id,
    type: row.type,
    amount: Number(row.amount),
    occurredOn: row.occurred_on,
    method: row.method,
    notes: row.notes,
  }
}

function mapOrder(row: CustodyOrderRow, movements: CustodyMovement[]): CustodyOrder {
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
    targetAmount: row.target_amount != null ? Number(row.target_amount) : null,
    expectedOn: row.expected_on,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    movements,
    totalDeposited,
    totalDisbursed,
    balanceHeld,
    isSettled: balanceHeld <= 0,
  }
}

export async function getCustodyOrders(): Promise<CustodyOrder[]> {
  const supabase = await createClient()

  const { data: orders, error } = await supabase
    .from("custody_orders")
    .select("id, person_name, title, target_amount, expected_on, status, notes, created_at")
    .order("created_at", { ascending: false })
    .overrideTypes<CustodyOrderRow[], { merge: false }>()

  if (error) throw new Error(error.message)
  if (!orders?.length) return []

  const { data: movements, error: mError } = await supabase
    .from("custody_movements")
    .select("id, custody_order_id, type, amount, occurred_on, method, notes")
    .in("custody_order_id", orders.map((o) => o.id))
    .order("occurred_on", { ascending: true })
    .overrideTypes<CustodyMovementRowDb[], { merge: false }>()

  if (mError) throw new Error(mError.message)

  const byOrder = new Map<string, CustodyMovement[]>()
  for (const row of movements ?? []) {
    const list = byOrder.get(row.custody_order_id) ?? []
    list.push(mapMovement(row))
    byOrder.set(row.custody_order_id, list)
  }

  return orders.map((o) => mapOrder(o, byOrder.get(o.id) ?? []))
}
