import { type Category } from "@/lib/category-types";
import { type CurrencyCode, type CurrencyTotals } from "@/lib/format";

export type CategoryBudget = {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  categoryDescription: string;
  amount: number;
  currency: CurrencyCode;
  spent: number;
  committed: number;
};

export type MonthlyBudgetTotal = {
  id: string;
  amount: number;
  currency: CurrencyCode;
};

export type BudgetOverview = {
  month: string;
  categories: Category[];
  categoryBudgets: CategoryBudget[];
  monthlyBudgets: MonthlyBudgetTotal[];
  spentByCurrency: CurrencyTotals;
  committedByCurrency: CurrencyTotals;
};
