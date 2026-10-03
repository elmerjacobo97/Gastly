import { type ReactNode } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SummaryMetricCard = {
  title: string;
  value: string;
  description?: ReactNode;
  emphasis?: boolean;
  negative?: boolean;
  footer?: ReactNode;
};

type SummaryMetricCardsProps = {
  ariaLabel: string;
  cards: SummaryMetricCard[];
  columns: 2 | 3 | 4;
};

const columnClasses: Record<SummaryMetricCardsProps["columns"], string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export function SummaryMetricCards({
  ariaLabel,
  cards,
  columns,
}: SummaryMetricCardsProps) {
  return (
    <section
      aria-label={ariaLabel}
      className={cn("grid gap-3", columnClasses[columns])}
    >
      {cards.map((card) => (
        <Card className="min-w-0" size="sm" key={card.title}>
          <CardHeader className="gap-1 pb-0">
            <CardTitle className="text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p
              className={cn(
                "font-mono font-semibold tracking-tight tabular-nums",
                card.emphasis ? "text-2xl" : "text-xl",
                card.negative ? "text-destructive" : "text-foreground",
              )}
            >
              {card.value}
            </p>
            {card.description != null && (
              <CardDescription className="text-xs">
                {card.description}
              </CardDescription>
            )}
            {card.footer != null && <div className="pt-1">{card.footer}</div>}
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
