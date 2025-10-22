"use client"

import { useState, useEffect } from "react"
import ProductCard from "./ProductCard"
import { useProducts } from "@/hooks/useProducts"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/models/Product"

interface ProductGridProps {
  categoryId?: string
  query?: string
  limit?: number
  compact?: boolean
  featured?: boolean
  refreshTrigger?: number
}

export function ProductGrid({
  categoryId,
  query,
  limit,
  compact = false,
  featured = false,
  refreshTrigger,
}: ProductGridProps) {
  const { products, loading, error } = useProducts(categoryId, query, limit, refreshTrigger)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])

  useEffect(() => {
    if (products && products.length > 0) {
      let filtered = [...products]

      // Si se solicitan productos destacados, filtrar por featured
      if (featured) {
        filtered = filtered.filter((product) => product.isInStock)
      }

      setFilteredProducts(filtered)

      // Log para depuración
      console.log(`ProductGrid: Mostrando ${filtered.length} productos${featured ? " destacados" : ""}`)
    }
  }, [products, featured])

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array(limit || 6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className={`h-${compact ? "32" : "40"} w-full rounded-lg`} />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
      </div>
    )
  }

  if (error) {
    return <div className="col-span-full text-center text-red-500">Error al cargar productos</div>
  }

  if (filteredProducts.length === 0) {
    return <div className="col-span-full text-center">No hay productos disponibles</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
      {filteredProducts.map((product) => (
        <div key={product.id} className="flex justify-center">
          <ProductCard key={product.id} product={product} />
        </div>
      ))}
    </div>
  )
}
