type CategoriesSectionProps = {
  categoriesPanel: React.ReactNode
  createCategoryDialog: React.ReactNode
}

export function CategoriesSection({ categoriesPanel, createCategoryDialog }: CategoriesSectionProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold">Categorías</h2>
          <p className="text-sm text-muted-foreground">Organiza tus ingresos y gastos por categoría.</p>
        </div>
        {createCategoryDialog}
      </div>
      {categoriesPanel}
    </div>
  )
}
