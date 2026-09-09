"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import {
  type CategoryTotal,
  type MonthlyTotal,
} from "@/features/transactions/server/charts-queries"

type DashboardChartsProps = {
  monthlyData?: MonthlyTotal[]
  categoryData?: CategoryTotal[]
}

const DashboardChartsView = dynamic(
  () =>
    import("@/features/transactions/components/dashboard-charts-view").then(
      (module) => module.DashboardChartsView
    ),
  {
    ssr: false,
    loading: () => <Skeleton className="h-52 w-full rounded-lg" />,
  }
)

export function DashboardCharts(props: DashboardChartsProps) {
  return <DashboardChartsView {...props} />
}
