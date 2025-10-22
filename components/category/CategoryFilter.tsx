"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useCategories } from "@/hooks/useCategories"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, X } from "lucide-react"
import { getCategoryIcon } from "@/utils/categoryIcons"

export function CategoryFilter() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const { categories, loading } = useCategories()

  const currentCategoryId = searchParams.get("category")

  const handleCategoryClick = (categoryId: string) => {
    router.push(`/products?category=${categoryId}`)
  }

  const handleClearFilter = () => {
    router.push("/products")
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex space-x-2">
        <Input
          placeholder="Buscar productos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" size="icon" variant="ghost">
          <Search className="h-4 w-4" />
        </Button>
      </form>

      <div>
        <h3 className="font-medium mb-2">Categorías</h3>
        <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
          {currentCategoryId && (
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start mb-2 bg-red-50 text-red-600 border-red-200"
              onClick={handleClearFilter}
            >
              <X className="mr-2 h-4 w-4" />
              Limpiar filtro
            </Button>
          )}

          {categories.map((category) => {
            const IconComponent = getCategoryIcon(category.name)
            const isActive = category.id === currentCategoryId

            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`w-full justify-start ${isActive ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={() => handleCategoryClick(category.id)}
              >
                <IconComponent className="mr-2 h-4 w-4" />
                {category.name}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default CategoryFilter
