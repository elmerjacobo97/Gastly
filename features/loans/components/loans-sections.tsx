'use client';

import { Fragment } from 'react';
import { LoanCard } from '@/features/loans/components/loan-card';
import { type Loan } from '@/features/loans/types/loan-types';

type LoansSectionsProps = {
  loans: Loan[];
  onEdit: (loan: Loan) => void;
  onHistory: (loan: Loan) => void;
  onDelete: (id: string) => void;
};

export function LoansSections({ loans, onEdit, onHistory, onDelete }: LoansSectionsProps) {
  const active = loans.filter((loan) => !loan.isSettled);
  const settled = loans.filter((loan) => loan.isSettled);

  const sections = [
    { title: 'Yo presté', loans: active.filter((loan) => loan.direction === 'lent'), settled: false },
    { title: 'Me prestaron', loans: active.filter((loan) => loan.direction === 'borrowed'), settled: false },
    { title: 'Saldados', loans: settled, settled: true },
  ];

  return (
    <Fragment>
      {sections.map(
        (section) =>
          section.loans.length > 0 && (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {section.title} ({section.loans.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.loans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    settled={section.settled}
                    onEdit={onEdit}
                    onHistory={onHistory}
                    onDelete={onDelete}
                  />
                ))}
              </div>
            </section>
          )
      )}
    </Fragment>
  );
}
