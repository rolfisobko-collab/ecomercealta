import { useCategories } from "@/hooks/useCategories"
import CategoryCard from "./CategoryCard"
import { Skeleton } from "@/components/ui/skeleton"

interface CategoryGridProps {
  query?: string
}

export default function CategoryGrid({ query }: CategoryGridProps) {
  const { categories, loading, error } = useCategories(query)

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col space-y-3">
            <Skeleton className="h-[180px] w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4 mx-auto" />
            <Skeleton className="h-3 w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return <div className="text-center text-red-500">Error: {error.message}</div>
  }

  if (categories.length === 0) {
    return <div className="text-center text-gray-500">No se encontraron categorías</div>
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {categories.map((category) => (
        <CategoryCard key={category.id} category={category} />
      ))}
    </div>
  )
}
