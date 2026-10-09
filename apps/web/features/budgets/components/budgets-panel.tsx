"use client";

import Link from "next/link";
import {
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  WalletCardsIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { MonthNav } from "@/components/month-nav";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  BudgetBar,
  BudgetLegend,
  budgetTone,
} from "@/features/budgets/components/budget-bar";
import { CategoryBudgetTable } from "@/features/budgets/components/category-budget-table";
import { CategoryBudgetDialog } from "@/features/budgets/components/category-budget-dialog";
import { MonthlyBudgetTotalDialog } from "@/features/budgets/components/monthly-budget-total-dialog";
import { calculateBudgetProgress } from "@/features/budgets/lib/budget-calculations";
import {
  deleteCategoryBudget,
  deleteMonthlyBudgetTotal,
} from "@/features/budgets/server/actions";
import {
  type BudgetOverview,
  type CategoryBudget,
} from "@/features/budgets/types/budget-types";
import {
  CURRENCY_CODES,
  formatCurrency,
  type CurrencyCode,
} from "@/lib/format";
import { cn } from "@/lib/utils";

type BudgetsPanelProps = {
  overview: BudgetOverview;
};

type DeleteTarget = {
  id: string;
  type: "category" | "total";
  label: string;
};

function BudgetMeter({
  limit,
  spent,
  committed,
  currency,
}: {
  limit: number;
  spent: number;
  committed: number;
  currency: CurrencyCode;
}) {
  const progress = calculateBudgetProgress(limit, spent, committed);
  const tone = budgetTone(progress);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {progress.isOverBudget ? "Excedido por" : "Te quedan"}
          </p>
          <p
            className={cn(
              "mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums",
              tone.text,
            )}
          >
            {formatCurrency(Math.abs(progress.remaining), currency)}
          </p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          <strong className={cn("font-semibold", tone.text)}>
            {progress.percentage}%
          </strong>{" "}
          de {formatCurrency(limit, currency)}
        </p>
      </div>
      <BudgetBar
        label={`${formatCurrency(spent, currency)} gastados y ${formatCurrency(committed, currency)} comprometidos de ${formatCurrency(limit, currency)}`}
        valueText={`${progress.percentage}% utilizado`}
        spentPercentage={progress.spentBarPercentage}
        totalPercentage={progress.barPercentage}
        isOverBudget={progress.isOverBudget}
        isNearLimit={progress.isNearLimit}
        className="h-2.5"
      />
      <BudgetLegend
        spent={spent}
        committed={committed}
        currency={currency}
        isOverBudget={progress.isOverBudget}
        isNearLimit={progress.isNearLimit}
        className="text-sm"
      />
    </div>
  );
}

export function BudgetsPanel({ overview }: BudgetsPanelProps) {
  const [currency, setCurrency] = useState<CurrencyCode>("PEN");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategoryBudget, setSelectedCategoryBudget] =
    useState<CategoryBudget | null>(null);
  const [totalDialogOpen, setTotalDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [isPending, startTransition] = useTransition();

  const categoryBudgets = overview.categoryBudgets.filter(
    (budget) => budget.currency === currency,
  );
  const totalBudget = overview.monthlyBudgets.find(
    (budget) => budget.currency === currency,
  );
  const spent = overview.spentByCurrency[currency] ?? 0;
  const committed = overview.committedByCurrency[currency] ?? 0;
  const availableCategories = overview.categories.filter(
    (category) =>
      !categoryBudgets.some((budget) => budget.categoryId === category.id),
  );
  const monthDate = new Date(`${overview.month}-01T12:00:00`);

  function openCategoryBudget(budget?: CategoryBudget) {
    setSelectedCategoryBudget(budget ?? null);
    setCategoryDialogOpen(true);
  }

  function handleDelete() {
    if (!deleteTarget) return;
    startTransition(async () => {
      try {
        if (deleteTarget.type === "category") {
          await deleteCategoryBudget(deleteTarget.id);
        } else {
          await deleteMonthlyBudgetTotal(deleteTarget.id);
        }
        toast.success("Presupuesto eliminado");
        setDeleteTarget(null);
      } catch (error) {
        toast.error("No se pudo eliminar el presupuesto", {
          description:
            error instanceof Error ? error.message : "Inténtalo de nuevo.",
        });
      }
    });
  }

  const addCategoryButton = (
    <Button
      size="sm"
      onClick={() => openCategoryBudget()}
      disabled={availableCategories.length === 0}
    >
      <PlusIcon />
      Añadir categoría
    </Button>
  );

  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <section className="flex flex-col gap-3 rounded-xl border bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
            Presupuestos
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Límites mensuales por categoría y moneda. Sueldo queda fuera.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <MonthNav value={monthDate} allowFuture />
          <div role="group" aria-label="Moneda de presupuestos">
            <SegmentedControl
              value={currency}
              onChange={setCurrency}
              options={CURRENCY_CODES.map((code) => ({
                value: code,
                label: code,
              }))}
            />
          </div>
        </div>
      </section>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
              <WalletCardsIcon className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">Límite global</CardTitle>
              <CardDescription>
                Incluye todos los gastos {currency}, también sin categoría.
              </CardDescription>
            </div>
          </div>
          <CardAction className="flex items-center gap-1 self-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTotalDialogOpen(true)}
            >
              {totalBudget ? <PencilIcon /> : <PlusIcon />}
              {totalBudget ? "Editar" : "Definir límite"}
            </Button>
            {totalBudget && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Eliminar límite global"
                onClick={() =>
                  setDeleteTarget({
                    id: totalBudget.id,
                    type: "total",
                    label: "límite global",
                  })
                }
              >
                <Trash2Icon />
              </Button>
            )}
          </CardAction>
        </CardHeader>
        <CardContent>
          {totalBudget ? (
            <BudgetMeter
              limit={totalBudget.amount}
              spent={spent}
              committed={committed}
              currency={currency}
            />
          ) : (
            <div>
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Gasto registrado
              </p>
              <p className="mt-1 font-mono text-3xl font-semibold tracking-tight tabular-nums">
                {formatCurrency(spent, currency)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Define un límite para ver cuánto te queda.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">
              Presupuestos por categoría
            </CardTitle>
            <CardDescription>
              {categoryBudgets.length === 0
                ? `Sin límites para ${currency} en ${overview.month}.`
                : `${categoryBudgets.length} categoría${categoryBudgets.length === 1 ? "" : "s"} con límite · ${currency}`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {categoryBudgets.length === 0 ? (
            <>
              <div className="flex justify-end">{addCategoryButton}</div>
              <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center">
                <p className="font-medium">
                  Todavía no hay límites por categoría
                </p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Elige categoría de gasto y monto mensual. Los gastos
                  aparecerán aquí a medida que los registres.
                </p>
                {overview.categories.length === 0 && (
                  <Link
                    href="/settings"
                    className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Crear categoría de gasto
                  </Link>
                )}
              </div>
            </>
          ) : (
            <CategoryBudgetTable
              budgets={categoryBudgets}
              currency={currency}
              toolbarAction={addCategoryButton}
              onEdit={openCategoryBudget}
              onDelete={(item) =>
                setDeleteTarget({
                  id: item.id,
                  type: "category",
                  label: item.categoryName,
                })
              }
            />
          )}
        </CardContent>
      </Card>

      {categoryDialogOpen && (
        <CategoryBudgetDialog
          key={`${selectedCategoryBudget?.id ?? "new"}:${overview.month}:${currency}`}
          open={categoryDialogOpen}
          onOpenChange={setCategoryDialogOpen}
          month={overview.month}
          currency={currency}
          categories={overview.categories}
          budget={selectedCategoryBudget ?? undefined}
        />
      )}
      {totalDialogOpen && (
        <MonthlyBudgetTotalDialog
          key={`${totalBudget?.id ?? "new"}:${overview.month}:${currency}`}
          open={totalDialogOpen}
          onOpenChange={setTotalDialogOpen}
          month={overview.month}
          currency={currency}
          budget={totalBudget}
        />
      )}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Eliminar presupuesto"
        description={`Se eliminará el límite de ${deleteTarget?.label ?? "presupuesto"} para ${overview.month} (${currency}).`}
        pending={isPending}
        onConfirm={handleDelete}
      />
    </main>
  );
}
