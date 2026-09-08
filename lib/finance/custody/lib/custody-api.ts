import { type CustodyMovement, type CustodyMovementRow, type CustodyOrder } from "@/lib/finance/custody/types/custody-types"

export function flattenCustodyMovements(orders: CustodyOrder[]): CustodyMovementRow[] {
  return orders.flatMap((order) =>
    order.movements.map((movement: CustodyMovement) => ({
      ...movement,
      personName: order.personName,
      orderTitle: order.title,
      orderStatus: order.status,
    }))
  )
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
