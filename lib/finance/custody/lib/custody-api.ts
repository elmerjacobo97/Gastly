import { createClient } from "@/lib/supabase/browser"
import {
  type CustodyMovement,
  type CustodyMovementRow,
  type CustodyOrder,
  type CustodyOrderStatus,
  type CustodyPaymentMethod,
} from "@/lib/finance/custody/types/custody-types"
import {
  type CustodyMovementValues,
  type CustodyOrderValues,
} from "@/lib/finance/custody/schemas/custody-schemas"

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

type CustodyMovementRowDb = {
  id: string
  custody_order_id: string
  type: "deposit" | "disbursement"
  amount: number | string
  occurred_on: string
  method: CustodyPaymentMethod | null
  notes: string | null
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
  const supabase = createClient()

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

export function flattenCustodyMovements(orders: CustodyOrder[]): CustodyMovementRow[] {
  return orders.flatMap((order) =>
    order.movements.map((movement) => ({
      ...movement,
      personName: order.personName,
      orderTitle: order.title,
      orderStatus: order.status,
    }))
  )
}

export async function createCustodyOrder(values: CustodyOrderValues): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase.from("custody_orders").insert({
    user_id: user.id,
    person_name: values.personName,
    title: values.title,
    target_amount: values.targetAmount && values.targetAmount > 0 ? values.targetAmount : null,
    expected_on: values.expectedOn || null,
    notes: values.notes || null,
  })

  if (error) throw new Error(error.message)
}

export async function updateCustodyOrder(
  id: string,
  values: CustodyOrderValues
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase
    .from("custody_orders")
    .update({
      person_name: values.personName,
      title: values.title,
      target_amount: values.targetAmount && values.targetAmount > 0 ? values.targetAmount : null,
      expected_on: values.expectedOn || null,
      notes: values.notes || null,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function updateCustodyOrderStatus(
  id: string,
  status: CustodyOrderStatus
): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase
    .from("custody_orders")
    .update({ status })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function deleteCustodyOrder(id: string): Promise<void> {
  const supabase = createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Debes iniciar sesión.")

  const { error } = await supabase.from("custody_orders").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export async function recordCustodyMovement(
  custodyOrderId: string,
  values: CustodyMovementValues
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("custody_movements").insert({
    custody_order_id: custodyOrderId,
    type: values.type,
    amount: values.amount,
    occurred_on: values.occurredOn,
    method: values.type === "deposit" ? values.method || null : null,
    notes: values.notes || null,
  })
  if (error) throw new Error(error.message)
}

export async function updateCustodyMovement(
  id: string,
  values: CustodyMovementValues
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from("custody_movements")
    .update({
      type: values.type,
      amount: values.amount,
      occurred_on: values.occurredOn,
      method: values.type === "deposit" ? values.method || null : null,
      notes: values.notes || null,
    })
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function deleteCustodyMovement(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("custody_movements").delete().eq("id", id)
  if (error) throw new Error(error.message)
}

export function computeCustodySummary(orders: CustodyOrder[]) {
  const active = orders.filter((o) => o.status === "active")
  const completed = orders.filter((o) => o.status === "completed")
  const totalHeld = active.reduce((s, o) => s + o.balanceHeld, 0)

  return {
    totalHeld,
    activeCount: active.length,
    completedCount: completed.length,
  }
}
