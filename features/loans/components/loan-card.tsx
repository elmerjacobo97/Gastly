"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  CheckCircle2Icon,
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddLoanDialog } from "@/features/loans/components/add-loan-dialog";
import { RecordPaymentDialog } from "@/features/loans/components/record-payment-dialog";
import { earliestLoanedOn } from "@/features/loans/lib/group-loans";
import { type LoanPersonGroup } from "@/features/loans/types/loan-types";
import { formatCurrency } from "@/lib/format";

type LoanCardProps = {
  group: LoanPersonGroup;
  settled: boolean;
  onEdit: (group: LoanPersonGroup) => void;
  onDetails: (group: LoanPersonGroup) => void;
  onDelete: (group: LoanPersonGroup) => void;
};

export function LoanCard({
  group,
  settled,
  onEdit,
  onDetails,
  onDelete,
}: LoanCardProps) {
  const loanedOn = earliestLoanedOn(group);
  const pendingBalances = group.balances.filter((loan) => !loan.isSettled);
  const expectedDates = group.balances
    .filter((loan) => loan.expectedOn)
    .toSorted((a, b) => a.expectedOn!.localeCompare(b.expectedOn!));
  const nextExpected = expectedDates[0]?.expectedOn;

  return (
    <Card className={settled ? "opacity-60" : undefined}>
      <CardHeader className="flex flex-row items-start justify-between pb-3">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">
            {group.personName}
          </CardTitle>
          <CardDescription>
            {settled
              ? group.direction === "lent"
                ? "Presté · "
                : "Me prestaron · "
              : group.direction === "lent"
                ? "Desde el "
                : "Recibido el "}
            {format(new Date(`${loanedOn}T12:00:00`), "d MMM yyyy", {
              locale: es,
            })}
          </CardDescription>
          {!settled && group.balances.length > 1 && (
            <p className="mt-1 text-xs text-muted-foreground">
              {group.balances.length} monedas
            </p>
          )}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-muted-foreground"
            >
              <MoreHorizontalIcon />
              <span className="sr-only">Acciones</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onEdit(group)}>
              <PencilIcon />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDetails(group)}>
              <EyeIcon />
              Ver detalle
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => onDelete(group)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2Icon />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {settled ? (
          <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2Icon className="size-4" />
            Saldado
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {pendingBalances.map((loan) => (
              <div
                key={loan.id}
                className="flex items-center justify-between gap-3"
              >
                <span className="text-xs text-muted-foreground">
                  Pendiente · {loan.currency}
                </span>
                <span className="text-sm font-semibold tabular-nums text-destructive">
                  {formatCurrency(loan.pendingAmount, loan.currency)}
                </span>
              </div>
            ))}
            {nextExpected && (
              <Badge variant="secondary" className="w-fit text-xs font-normal">
                {group.direction === "lent"
                  ? "Devolución: "
                  : "Pagar antes del "}
                {format(new Date(`${nextExpected}T12:00:00`), "d MMM yyyy", {
                  locale: es,
                })}
                {expectedDates.length > 1
                  ? ` · ${expectedDates.length} fechas`
                  : ""}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2">
        <AddLoanDialog group={group} />
        {pendingBalances.length > 0 ? (
          <RecordPaymentDialog
            personName={group.personName}
            balances={pendingBalances}
          />
        ) : null}
        <Button variant="ghost" size="sm" onClick={() => onDetails(group)}>
          Ver detalle
          <span className="sr-only"> de {group.personName}</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
