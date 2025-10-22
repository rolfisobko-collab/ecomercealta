import { CategoryGridClient } from "./client-components"

export default function CategoriesPage() {
  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Categorías</h1>
        <p className="text-gray-500 dark:text-gray-400">Explora todas nuestras categorías de productos</p>
      </div>

      <CategoryGridClient />
    </div>
  )
}
