"use client"

import { useEffect, useState } from "react"
import { catalogDB, type CachedProduct, type CachedCategory } from "@/lib/dexie"

interface CatalogState {
  products: CachedProduct[]
  categories: CachedCategory[]
  loading: boolean
  error?: string
}

export function useCatalogCache() {
  const [state, setState] = useState<CatalogState>({ products: [], categories: [], loading: true })

  // 1) Cargar instantáneo desde IndexedDB
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [products, categories] = await Promise.all([
          catalogDB.products.toArray(),
          catalogDB.categories.toArray(),
        ])
        if (!cancelled) {
          setState((s) => ({ ...s, products, categories, loading: false }))
        }
      } catch (e) {
        console.error("Dexie read error", e)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // 2) Sincronizar en background desde API
  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    const normalizeProduct = (p: any): CachedProduct => ({
      id: String(p.id || p._id),
      name: p.name || "",
      price: Number(p.price || 0),
      image1: p.image1,
      images: Array.isArray(p.images) ? p.images : [],
      category: String(p.category ?? p.categoryId ?? ""),
      isInStock: (p as any).isInStock ?? ((p.quantity ?? p.stock ?? 0) > 0),
      location: String(p.location ?? p.ubicacion ?? ''),
      liquidation: Boolean((p as any).liquidation ?? false),
      weeklyOffer: Boolean((p as any).weeklyOffer ?? false),
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
    })

    const sync = async () => {
      try {
        // Full fetch por simplicidad (optimizable a deltas luego)
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/products?limit=100000&skip=0`, { signal: controller.signal, cache: "no-store" }),
          fetch(`/api/categories`, { signal: controller.signal, cache: "no-store" }),
        ])
        if (!prodRes.ok) throw new Error(await prodRes.text())
        if (!catRes.ok) throw new Error(await catRes.text())
        const rawProducts = await prodRes.json()
        const rawCategories = await catRes.json()

        const products: CachedProduct[] = Array.isArray(rawProducts) ? rawProducts.map(normalizeProduct) : []
        const categories: CachedCategory[] = Array.isArray(rawCategories)
          ? rawCategories.map((c: any) => ({ id: String(c.id || c._id), name: c.name || "", updatedAt: c.updatedAt }))
          : []

        if (cancelled) return

        // Escribir en Dexie (transacción)
        await catalogDB.transaction('rw', catalogDB.products, catalogDB.categories, async () => {
          await catalogDB.products.clear()
          await catalogDB.products.bulkAdd(products)
          await catalogDB.categories.clear()
          await catalogDB.categories.bulkAdd(categories)
        })

        if (!cancelled) {
          setState({ products, categories, loading: false })
        }
      } catch (e: any) {
        if (e?.name === 'AbortError') return
        console.error("Catalog sync error", e)
        if (!cancelled) setState((s) => ({ ...s, loading: false, error: e?.message || 'sync error' }))
      }
    }

    // pequeño retraso para no competir con SSR/ISR del primer render
    const t = setTimeout(sync, 0)
    return () => { cancelled = true; controller.abort(); clearTimeout(t) }
  }, [])

  return state
}
