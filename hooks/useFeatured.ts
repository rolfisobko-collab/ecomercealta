"use client"

import { useEffect, useMemo, useState } from "react"
import { useCatalogCache } from "@/hooks/useCatalogCache"
import { fetchWithTimeout } from "@/utils/net"

export interface FeaturedData {
  liquidation: any[]
  weekly: any[]
}

export function useFeatured(limit = 24, opts?: { fallbackWeekly?: boolean; fallbackLiquidation?: boolean }) {
  const catalog = useCatalogCache()
  const [data, setData] = useState<FeaturedData>({ liquidation: [], weekly: [] })

  const fallback = useMemo(() => {
    const products = (catalog.products || []) as any[]
    const liquidation = products.filter((p: any) => !!p?.liquidation).slice(0, limit)
    const weekly = products.filter((p: any) => !!p?.weeklyOffer).slice(0, limit)
    return { liquidation, weekly }
  }, [catalog.products, limit])

  useEffect(() => {
    let cancelled = false
    const load = async (attempt = 1) => {
      try {
        const res = await fetchWithTimeout(`/api/featured?limit=${limit}`, { cache: 'no-store', timeout: 6000 })
        if (!res.ok) throw new Error('featured error')
        const json = await res.json()
        if (!cancelled) setData({
          liquidation: Array.isArray(json?.liquidation) ? json.liquidation : [],
          weekly: Array.isArray(json?.weekly) ? json.weekly : [],
        })
      } catch {
        if (attempt < 2) {
          // brief retry
          setTimeout(() => { if (!cancelled) load(attempt + 1) }, 500)
        } else if (!cancelled) {
          setData({
            liquidation: (opts?.fallbackLiquidation ?? true) ? fallback.liquidation : [],
            weekly: (opts?.fallbackWeekly ?? true) ? fallback.weekly : [],
          })
        }
      }
      // schedule a single refresh shortly to capture recent admin changes
      if (!cancelled) {
        setTimeout(() => { if (!cancelled) load(2) }, 1500)
      }
    }
    load(1)
    return () => { cancelled = true }
  }, [limit, fallback])

  const liquidation = data.liquidation.length
    ? data.liquidation
    : (opts?.fallbackLiquidation ?? true) ? fallback.liquidation : []
  const weekly = data.weekly.length
    ? data.weekly
    : (opts?.fallbackWeekly ?? true) ? fallback.weekly : []

  return { liquidation, weekly }
}
