"use client"

import { useState, useEffect, useRef } from "react"
import type { Product } from "@/models/Product"
// Consumir API del server para leer siempre desde Mongo Atlas sin cargar Mongoose en el cliente

export function useProducts(
  categoryId?: string,
  searchTerm?: string,
  includeTagsOrMax?: boolean | number,
  refreshTrigger = 0,
) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const includeTags = typeof includeTagsOrMax === 'boolean' ? includeTagsOrMax : false
    const maxItems = typeof includeTagsOrMax === 'number' ? includeTagsOrMax : undefined

    const fetchProgressively = async () => {
      try {
        setLoading(true)
        setProducts([])
        setError(null)

        // Cancel previous in-flight requests
        if (abortRef.current) abortRef.current.abort()
        abortRef.current = new AbortController()

        const baseParams = new URLSearchParams()
        if (searchTerm) baseParams.set("q", searchTerm)
        if (includeTags) baseParams.set("includeTags", "1")
        // API espera "category" (no categoryId)
        if (categoryId) baseParams.set("category", categoryId)

        const BATCH_SIZE = 100
        let skip = 0
        let totalFetched = 0
        let firstBatchShown = false

        // Loop hasta traer todos o alcanzar maxItems
        while (true) {
          const limitThisBatch = Math.min(
            BATCH_SIZE,
            typeof maxItems === 'number' ? Math.max(0, maxItems - totalFetched) : BATCH_SIZE,
          )
          if (limitThisBatch === 0) break

          const params = new URLSearchParams(baseParams)
          params.set("limit", String(limitThisBatch))
          params.set("skip", String(skip))

          const url = `/api/products?${params.toString()}`
          const res = await fetch(url, { signal: abortRef.current.signal })
          if (!res.ok) throw new Error(`API error ${res.status}`)
          const batch: Product[] = await res.json()

          // Añadir lote al estado
          setProducts(prev => {
            // Evitar duplicados por si hay intersección entre colecciones
            const seen = new Set(prev.map(p => p.id))
            const merged = prev.concat(batch.filter(b => !seen.has(b.id)))
            return merged
          })

          // Mostrar resultados desde el primer lote
          if (!firstBatchShown) {
            firstBatchShown = true
            setLoading(false)
          }

          totalFetched += batch.length
          skip += batch.length

          // Si el lote es menor que el tamaño, no hay más datos
          if (batch.length < limitThisBatch) break
          // Pequeño respiro para no bloquear la UI
          await new Promise(r => setTimeout(r, 0))
        }
      } catch (err) {
        if ((err as any)?.name === 'AbortError') return
        console.error("❌ Error in useProducts:", err)
        setError(err instanceof Error ? err : new Error("Error desconocido"))
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProgressively()

    return () => {
      if (abortRef.current) abortRef.current.abort()
    }
  }, [categoryId, searchTerm, includeTagsOrMax, refreshTrigger])

  return { products, loading, error }
}

export default useProducts
