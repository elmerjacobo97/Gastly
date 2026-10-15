import { format } from "date-fns";

import {
  type LoanCurrencyTotal,
  type LoanMovementRow,
  type LoanPersonGroup,
} from "@/features/loans/types/loan-types";
import { formatCurrency, formatDate } from "@/lib/format";

type AccountStatementInput = {
  group: LoanPersonGroup;
  movements: LoanMovementRow[];
  ownerName: string;
  today?: Date;
};

function pendingLine(movement: LoanMovementRow) {
  const pending = formatCurrency(movement.pendingAmount, movement.currency);
  const original = formatCurrency(movement.amount, movement.currency);
  let amount = pending;
  if (movement.pendingAmount < movement.amount) {
    amount = `${pending} pendientes de ${original}`;
  } else if (movement.pendingAmount > movement.amount) {
    amount = `${pending} con interés`;
  }

  return `• ${[formatDate(movement.occurredOn), movement.description, amount]
    .filter(Boolean)
    .join(" · ")}`;
}

function balanceLine(
  total: LoanCurrencyTotal,
  ownerName: string,
  personName: string,
) {
  const money = (value: number) => formatCurrency(value, total.currency);
  const result =
    total.net === 0
      ? "*A mano*"
      : `*${total.net > 0 ? personName : ownerName} debe ${money(Math.abs(total.net))}*`;
  if (total.lent > 0 && total.borrowed > 0) {
    return `${money(total.lent)} − ${money(total.borrowed)} = ${result}`;
  }
  return total.net === 0
    ? `${money(total.lent + total.borrowed)} = ${result}`
    : result;
}

/** WhatsApp-ready summary of what is still pending between the owner and one person. */
export function buildAccountStatement({
  group,
  movements,
  ownerName,
  today = new Date(),
}: AccountStatementInput) {
  const pending = movements
    .filter(
      (movement) =>
        movement.kind === "disbursement" && movement.pendingAmount > 0,
    )
    .toSorted((a, b) => a.occurredOn.localeCompare(b.occurredOn));
  const forOwner = pending.filter((movement) => movement.direction === "lent");
  const forPerson = pending.filter(
    (movement) => movement.direction === "borrowed",
  );

  const lines = [
    `*Estado de cuenta · ${ownerName} y ${group.personName}*`,
    formatDate(format(today, "yyyy-MM-dd")),
  ];

  if (pending.length === 0) {
    lines.push("", "Sin saldos pendientes.");
    return lines.join("\n");
  }

  if (forOwner.length > 0) {
    lines.push(
      "",
      `*${group.personName} debe a ${ownerName}*`,
      ...forOwner.map(pendingLine),
    );
  }
  if (forPerson.length > 0) {
    lines.push(
      "",
      `*${ownerName} debe a ${group.personName}*`,
      ...forPerson.map(pendingLine),
    );
  }
  lines.push(
    "",
    "*Saldo*",
    ...group.totals.map((total) =>
      balanceLine(total, ownerName, group.personName),
    ),
  );

  return lines.join("\n");
}
