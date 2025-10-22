"use client"

import { useState, useEffect } from "react"
import type { Product } from "@/models/Product"
import { productService } from "@/services/hybrid/productService"

export function useFeaturedProducts(limit = 8) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true)
        console.log("useFeaturedProducts: Fetching featured products...")

        const data = await productService.getFeatured(limit)

        console.log(`useFeaturedProducts: Fetched ${data.length} featured products`)
        setProducts(data)
      } catch (err) {
        console.error("Error in useFeaturedProducts:", err)
        setError(err instanceof Error ? err : new Error("Error desconocido"))
      } finally {
        setLoading(false)
      }
    }

    fetchFeaturedProducts()
  }, [limit])

  return { products, loading, error }
}
