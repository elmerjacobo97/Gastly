export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  targetDate: string | null
  color: string
  notes: string | null
  createdAt: string
  progress: number
  remaining: number
  isCompleted: boolean
}
