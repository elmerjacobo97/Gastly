"use client";

import { HandCoinsIcon } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { LoanDialog } from "@/features/loans/components/loan-dialog";
import { LoansSummaryCards } from "@/features/loans/components/loans-summary-cards";
import { LoansWorkspace } from "@/features/loans/components/loans-workspace";
import { uniquePersonNames } from "@/features/loans/lib/group-loans";
import { type Loan } from "@/features/loans/types/loan-types";

type LoansPanelProps = {
  loans: Loan[];
};

export function LoansPanel({ loans }: LoansPanelProps) {
  const personNames = uniquePersonNames(loans);

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Préstamos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Consulta tus deudas y todos sus movimientos en un solo lugar.
          </p>
        </div>
        <LoanDialog loans={loans} personNames={personNames} />
      </section>

      {loans.length > 0 && <LoansSummaryCards loans={loans} />}

      {loans.length === 0 && (
        <Empty className="border border-dashed py-16">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HandCoinsIcon />
            </EmptyMedia>
            <EmptyTitle>No hay préstamos registrados</EmptyTitle>
            <EmptyDescription>
              Registra el dinero que prestas para hacerle seguimiento.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <LoanDialog
              loans={loans}
              personNames={personNames}
              triggerLabel="Registrar primer préstamo"
            />
          </EmptyContent>
        </Empty>
      )}

      {loans.length > 0 && <LoansWorkspace loans={loans} />}
    </main>
  );
}
