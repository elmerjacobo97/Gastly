import { CategoriesPanel } from "@/features/categories/components/categories-panel"

export function CategoriesSection() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-base font-semibold">Categorías</h2>
        <p className="text-sm text-muted-foreground">Organiza tus ingresos y gastos por categoría.</p>
      </div>
      <CategoriesPanel embedded />
    </div>
  )
}
