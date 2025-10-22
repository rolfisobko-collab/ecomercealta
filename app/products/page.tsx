import { Suspense } from "react"
import { CategoryFilter } from "@/components/category/CategoryFilter"
import { ProductGrid } from "@/components/product/ProductGrid"

interface ProductsPageProps {
  searchParams: {
    category?: string
    search?: string
  }
}

export default function ProductsPage({ searchParams }: ProductsPageProps) {
  const { category, search } = searchParams

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-gray-500 dark:text-gray-400">Explora nuestra amplia gama de productos de telefonía</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/4">
          <CategoryFilter />
        </div>
        <div className="w-full md:w-3/4">
          <Suspense fallback={<div>Cargando productos...</div>}>
            <ProductGrid categoryId={category} query={search} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
