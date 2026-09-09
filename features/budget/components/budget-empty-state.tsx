"use client"

import { PiggyBankIcon } from "lucide-react"

import {
  Card,
  CardContent,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { CreateBudgetDialog } from "@/features/budget/components/create-budget-dialog"
import { type Category } from "@/features/categories/types/category-types"

export function BudgetEmptyState({ categories }: { categories: Category[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Empty className="border bg-muted/20">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <PiggyBankIcon />
            </EmptyMedia>
            <EmptyTitle>Sin presupuestos aún</EmptyTitle>
            <EmptyDescription>
              Crea tu primer presupuesto para controlar cuánto puedes gastar por categoría.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateBudgetDialog categories={categories} />
          </EmptyContent>
        </Empty>
      </CardContent>
    </Card>
  )
}
