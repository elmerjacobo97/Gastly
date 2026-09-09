"use client"

import { Fragment } from "react"

import { LoanCard } from "@/features/loans/components/loan-card"
import { groupLoansByPerson } from "@/features/loans/lib/group-loans"
import { type Loan, type LoanPersonGroup } from "@/features/loans/types/loan-types"

type LoansSectionsProps = {
  loans: Loan[]
  onEdit: (group: LoanPersonGroup) => void
  onHistory: (group: LoanPersonGroup) => void
  onDelete: (group: LoanPersonGroup) => void
}

export function LoansSections({ loans, onEdit, onHistory, onDelete }: LoansSectionsProps) {
  const groups = groupLoansByPerson(loans)
  const active = groups.filter((group) => !group.isSettled)
  const settled = groups.filter((group) => group.isSettled)

  const sections = [
    { title: "Yo presté", groups: active.filter((group) => group.direction === "lent"), settled: false },
    { title: "Me prestaron", groups: active.filter((group) => group.direction === "borrowed"), settled: false },
    { title: "Saldados", groups: settled, settled: true },
  ]

  return (
    <Fragment>
      {sections.map(
        (section) =>
          section.groups.length > 0 && (
            <section key={section.title} className="flex flex-col gap-3">
              <h2 className="text-sm font-medium text-muted-foreground">
                {section.title} ({section.groups.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {section.groups.map((group) => (
                  <LoanCard
                    key={group.key}
                    group={group}
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
  )
}
