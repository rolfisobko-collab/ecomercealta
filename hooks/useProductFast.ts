"use client"

import { useEffect, useState, useRef } from "react"
import type { CachedProduct } from "@/lib/dexie"
import { catalogDB } from "@/lib/dexie"

export function useProductFast(id: string) {
  const [product, setProduct] = useState<CachedProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setLoading(true)
        setError(null)
        // 1) Instant from Dexie
        try {
          const cached = await catalogDB.products.get(id)
          if (!cancelled && cached) setProduct(cached)
        } catch {}

        // 2) Fresh from API (query param id)
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller
        const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
          signal: controller.signal,
          cache: "no-store",
        })
        if (!res.ok) throw new Error(`API error ${res.status}`)
        const data = await res.json()
        // The API may return an object (single) or array; normalize
        const fresh = Array.isArray(data) ? data[0] : data
        if (!cancelled && fresh) {
          setProduct({
            id: String(fresh.id || fresh._id || id),
            name: fresh.name || "",
            price: Number(fresh.price || 0),
            image1: fresh.image1,
            images: Array.isArray(fresh.images) ? fresh.images : [],
            category: String(fresh.category ?? fresh.categoryId ?? ""),
            isInStock: (fresh as any).isInStock ?? ((fresh.quantity ?? fresh.stock ?? 0) > 0),
            location: String(fresh.location ?? (fresh as any).ubicacion ?? ''),
            liquidation: Boolean((fresh as any).liquidation ?? false),
            updatedAt: fresh.updatedAt,
            createdAt: fresh.createdAt,
          })
          // 3) Persist back into Dexie for next time
          try { await catalogDB.products.put({
            id: String(fresh.id || fresh._id || id),
            name: fresh.name || "",
            price: Number(fresh.price || 0),
            image1: fresh.image1,
            images: Array.isArray(fresh.images) ? fresh.images : [],
            category: String(fresh.category ?? fresh.categoryId ?? ""),
            isInStock: (fresh as any).isInStock ?? ((fresh.quantity ?? fresh.stock ?? 0) > 0),
            location: String(fresh.location ?? (fresh as any).ubicacion ?? ''),
            liquidation: Boolean((fresh as any).liquidation ?? false),
            updatedAt: fresh.updatedAt,
            createdAt: fresh.createdAt,
          }) } catch {}
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        setError(e?.message || 'Error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true; if (abortRef.current) abortRef.current.abort() }
  }, [id])

  return { product, loading, error }
}

export default useProductFast
