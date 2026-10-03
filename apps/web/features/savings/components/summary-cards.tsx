import { SummaryMetricCards } from "@/components/summary-metric-cards";
import { Progress } from "@/components/ui/progress";
import { type SavingsGoal } from "@/features/savings/types/savings-types";
import { formatCurrency } from "@/lib/format";

export function SummaryCards({ goals }: { goals: SavingsGoal[] }) {
  const active = goals.filter((g) => !g.isCompleted);
  const completed = goals.filter((g) => g.isCompleted);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallProgress =
    totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  return (
    <SummaryMetricCards
      ariaLabel="Resumen de metas de ahorro"
      cards={[
        {
          title: "Metas activas",
          value: String(active.length),
          description: `${completed.length} ${completed.length === 1 ? "meta completada" : "metas completadas"}`,
        },
        {
          title: "Total ahorrado",
          value: formatCurrency(totalSaved),
          description: `de ${formatCurrency(totalTarget)}`,
          emphasis: true,
        },
        {
          title: "Progreso global",
          value: `${overallProgress}%`,
          description: "Avance frente al total de metas",
          footer: <Progress value={overallProgress} className="h-1.5" />,
        },
      ]}
      columns={3}
    />
  );
}
