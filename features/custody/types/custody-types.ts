export type CustodyOrderStatus = "active" | "completed" | "cancelled"

export type CustodyMovementType = "deposit" | "disbursement"

export type CustodyPaymentMethod = "yape" | "plin" | "transfer" | "cash"

export type CustodyMovement = {
  id: string
  custodyOrderId: string
  type: CustodyMovementType
  amount: number
  occurredOn: string
  method: CustodyPaymentMethod | null
  notes: string | null
}

export type CustodyOrder = {
  id: string
  personName: string
  title: string
  targetAmount: number | null
  expectedOn: string | null
  status: CustodyOrderStatus
  notes: string | null
  createdAt: string
  movements: CustodyMovement[]
  totalDeposited: number
  totalDisbursed: number
  balanceHeld: number
  isSettled: boolean
}

export type CustodyMovementRow = CustodyMovement & {
  personName: string
  orderTitle: string
  orderStatus: CustodyOrderStatus
}
