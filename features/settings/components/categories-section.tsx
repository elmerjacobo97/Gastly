import { CategoriesPanel } from "@/features/categories/components/categories-panel"
import { CreateCategoryDialog } from "@/features/categories/components/create-category-dialog"

export function CategoriesSection() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Categorías</h2>
          <p className="text-sm text-muted-foreground">Organiza tus ingresos y gastos por categoría.</p>
        </div>
        <CreateCategoryDialog />
      </div>
      <CategoriesPanel embedded />
    </div>
  )
}
