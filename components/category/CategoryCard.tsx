"use client"
import { Card, CardContent } from "@/components/ui/card"
import { getCategoryIcon } from "@/utils/categoryIcons"
import type { Category } from "@/models/Category"

interface CategoryCardProps {
  category: Category
  showNavigation?: boolean
}

export default function CategoryCard({ category, showNavigation = true }: CategoryCardProps) {
  const IconComponent = getCategoryIcon(category.name)

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md group">
      <CardContent className="p-6 flex flex-col items-center text-center space-y-4">
        <div className="p-3 bg-red-50 rounded-full dark:bg-red-900/20 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
          <IconComponent className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold">{category.name}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
