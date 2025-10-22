"use client"

import { useEffect, useState } from "react"
import { useFavorites } from "@/context/FavoritesContext"
import ProductCard from "@/components/product/ProductCard"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart } from "lucide-react"
import type { Product } from "@/models/Product"
import { getProductById } from "@/services/hybrid/productService"

export default function FavoritesPreview() {
  const { favorites, loading, error } = useFavorites()
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadFavoriteProducts() {
      if (!favorites.length) {
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        // Limitar a los 4 favoritos más recientes
        const recentFavorites = favorites.slice(0, 4)

        const productPromises = recentFavorites.map((fav) => getProductById(fav.productId))

        const fetchedProducts = await Promise.all(productPromises)
        // Filtrar productos null (que podrían ocurrir si un producto fue eliminado)
        const validProducts = fetchedProducts.filter((p) => p !== null) as Product[]

        setProducts(validProducts)
      } catch (err) {
        console.error("Error cargando productos favoritos:", err)
      } finally {
        setIsLoading(false)
      }
    }

    if (!loading) {
      loadFavoriteProducts()
    }
  }, [favorites, loading])

  if (loading || isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500">Error al cargar favoritos</p>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-2">
          <Heart className="h-6 w-6 text-gray-400" />
        </div>
        <p className="text-sm text-muted-foreground">No tienes productos favoritos</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} showAddToCart={false} />
      ))}
    </div>
  )
}
