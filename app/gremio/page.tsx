"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProductCard from "@/components/product/ProductCard"
import { productService } from "@/services/hybrid/productService"
import type { Product } from "@/models/Product"
import Link from "next/link"
import { Boxes, LayoutGrid, List, Smartphone, Battery, Headphones, Camera, Cpu, Monitor, Plug, Shield, Wrench, Package, Mic, Speaker, Watch, CreditCard, Cpu as CpuChip, Radio, Flashlight } from "lucide-react"

export const dynamic = 'force-dynamic'

export default function GremioProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [view, setView] = useState<"cards" | "list">("cards")
  const [q, setQ] = useState("")
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || ""
  const [categoryNameToId, setCategoryNameToId] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [categoryIdToName, setCategoryIdToName] = useState<Record<string, string>>({})
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})

  const CATEGORY_ICON_RULES: Array<{ test: RegExp; Icon: any }> = [
    { test: /(bater[ií]a|battery)/i, Icon: Battery },
    { test: /(pantalla|display|lcd|oled)/i, Icon: Monitor },
    { test: /(c[aá]mara|camera|lente)/i, Icon: Camera },
    { test: /(auricular|earbud|headphone|manos\s*libres)/i, Icon: Headphones },
    { test: /(parlante|altavoz|speaker)/i, Icon: Speaker },
    { test: /(micr[oó]fono|mic)/i, Icon: Mic },
    { test: /(cargador|cable|usb|type\s*c|dock|conector\s*de\s*carga|charging)/i, Icon: Plug },
    { test: /(funda|case|protector|vidrio|templado|glass|film)/i, Icon: Shield },
    { test: /(herramienta|tool|pinza|destornillador|prensa|spudger)/i, Icon: Wrench },
    { test: /(placa|board|mother|mainboard|pcb|ic|chip|cpu|pmic|power\s*ic|audio\s*ic)/i, Icon: Cpu },
    { test: /(flex|cable\s*flex|volumen|power\s*flex|bot[oó]n|sensor)/i, Icon: CpuChip },
    { test: /(smart\s*watch|reloj|watch)/i, Icon: Watch },
    { test: /(sim|bandeja|tray|lector\s*sim)/i, Icon: CreditCard },
    { test: /(antena|se[nñ]al|rf)/i, Icon: Radio },
    { test: /(flash|linterna|led)/i, Icon: Flashlight },
    { test: /(accesorio|repuesto|pieza|varios|otros)/i, Icon: Package },
    { test: /(celu|smart|tel[eé]fono|iphone|samsung|motorola|xiaomi|huawei)/i, Icon: Smartphone },
  ]

  const getCategoryIcon = (name: string) => {
    for (const rule of CATEGORY_ICON_RULES) {
      if (rule.test.test(name)) return rule.Icon
    }
    return Boxes
  }

  // Custom category ordering
  const getCategoryOrderKey = (name: string) => {
    const n = name.toLowerCase()
    // Priority groups (lower number = earlier)
    if (/herramienta/.test(n)) return [1, n] as const
    if (/(m[oó]dulo|modulo)/.test(n)) return [2, n] as const
    if (/bater[ií]a|battery/.test(n)) return [2, n] as const
    if (/c[aá]mara|camera/.test(n)) return [3, n] as const
    if (/(placa\s*de\s*carga|carga|charging|dock|conector)/.test(n)) return [4, n] as const
    if (/tapa/.test(n)) return [5, n] as const
    if (/chasis|frame|housing/.test(n)) return [6, n] as const
    if (/glass|vidrio|templado|mica|film/.test(n)) return [7, n] as const
    return [100, n] as const
  }

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        // Try cache from localStorage first
        const cachedRaw = typeof window !== 'undefined' ? localStorage.getItem('gremio_products_cache') : null
        let usedCache = false
        if (cachedRaw) {
          try {
            const cached = JSON.parse(cachedRaw) as { at: number; data: Product[] }
            const ttlMs = 30 * 60 * 1000
            if (Date.now() - cached.at < ttlMs && Array.isArray(cached.data)) {
              if (active) setProducts(cached.data)
              usedCache = true
            }
          } catch {}
        }

        if (!usedCache) setLoading(true)

        // Always fetch fresh in background
        setIsRefreshing(true)
        const timeoutMs = 3000
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs))
        try {
          const data = (await Promise.race([productService.getAll(), timeout])) as Product[] | null
          if (active && Array.isArray(data)) {
            setProducts(data)
            if (typeof window !== 'undefined') {
              try { localStorage.setItem('gremio_products_cache', JSON.stringify({ at: Date.now(), data })) } catch {}
            }
          } else if (data === null) {
            // Timed out: fetch in background and update when ready
            productService.getAll().then((fresh) => {
              if (!active || !Array.isArray(fresh)) return
              setProducts(fresh)
              if (typeof window !== 'undefined') {
                try { localStorage.setItem('gremio_products_cache', JSON.stringify({ at: Date.now(), data: fresh })) } catch {}
              }
            }).catch(() => {})
          }
        } catch {
          // Network error or timeout: keep showing cached data if any
        } finally {
          setIsRefreshing(false)
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    // Listen to cache updates from other tabs
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'gremio_products_cache' && e.newValue) {
        try {
          const cached = JSON.parse(e.newValue) as { at: number; data: Product[] }
          if (Array.isArray(cached.data)) setProducts(cached.data)
        } catch {}
      }
    }
    if (typeof window !== 'undefined') window.addEventListener('storage', onStorage)
    return () => {
      active = false
      if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    let active = true
    const loadCats = async () => {
      try {
        // Serve cached categories first if fresh
        const cachedCatsRaw = typeof window !== 'undefined' ? localStorage.getItem('gremio_categories_cache') : null
        if (cachedCatsRaw) {
          try {
            const cached = JSON.parse(cachedCatsRaw) as { at: number; data: any[] }
            const ttlMs = 60 * 60 * 1000
            if (Date.now() - cached.at < ttlMs && Array.isArray(cached.data)) {
              const map: Record<string, string> = {}
              const list: { id: string; name: string }[] = []
              for (const c of cached.data) {
                const name = String(c.name || "").toLowerCase()
                const id = String(c.id ?? c._id ?? "")
                if (name && id) map[name] = id
                if (c?.name) list.push({ id: String(c.id ?? c._id ?? c.name), name: String(c.name) })
              }
              if (active) {
                setCategoryNameToId(map)
                setCategories(list)
                const reverse: Record<string, string> = {}
                for (const item of list) reverse[item.id] = item.name
                setCategoryIdToName(reverse)
              }
            }
          } catch {}
        }

        const res = await fetch("/api/categories", { cache: "no-store" })
        if (!res.ok) return
        const data = await res.json()
        const map: Record<string, string> = {}
        const list: { id: string; name: string }[] = []
        for (const c of Array.isArray(data) ? data : []) {
          const name = String(c.name || "").toLowerCase()
          const id = String(c.id ?? c._id ?? "")
          if (name && id) map[name] = id
          if (c?.name) list.push({ id: String(c.id ?? c._id ?? c.name), name: String(c.name) })
        }
        if (active) {
          setCategoryNameToId(map)
          setCategories(list)
          // Build reverse map id -> name
          const reverse: Record<string, string> = {}
          for (const item of list) reverse[item.id] = item.name
          setCategoryIdToName(reverse)
        }
        if (typeof window !== 'undefined') {
          try { localStorage.setItem('gremio_categories_cache', JSON.stringify({ at: Date.now(), data })) } catch {}
        }
      } catch {}
    }
    loadCats()
    return () => { active = false }
  }, [])

  const filtered = useMemo(() => {
    // Hide products without price or price <= 0
    const withPrice = products.filter((p) => Number((p as any)?.price) > 0)
    if (!q.trim()) return withPrice
    const term = q.toLowerCase()
    return withPrice.filter((p) =>
      [
        (p as any)?.name,
        (p as any)?.description,
        (p as any)?.brand,
        (p as any)?.category,
        (p as any)?.categoryName,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    )
  }, [products, q])

  const categoryFiltered = useMemo(() => {
    if (!selectedCategory) return filtered
    const sel = selectedCategory.toLowerCase()
    const targetId = categoryNameToId[sel]
    return filtered.filter((p) => {
      const nameMatch = String((p as any)?.category || (p as any)?.categoryName || "").toLowerCase() === sel
      const idMatch = targetId && String((p as any)?.categoryId || (p as any)?.category || "") === String(targetId)
      return nameMatch || idMatch
    })
  }, [filtered, selectedCategory, categoryNameToId])

  // Helper: derive display category name for a product
  const getCategoryName = (p: Product): string => {
    const anyP = p as any
    // 1) Si ya viene el nombre explícito
    if (anyP?.categoryName && typeof anyP.categoryName === 'string') return anyP.categoryName
    // 2) Intentar mapear por IDs conocidos (categoryId o category si es un ID)
    const possibleId = String(anyP?.categoryId || anyP?.category || '')
    if (possibleId && categoryIdToName[possibleId]) return categoryIdToName[possibleId]
    // 3) Si category resulta ser un nombre (no ID) y no hay mapeo, usarlo
    if (anyP?.category && typeof anyP.category === 'string') return String(anyP.category)
    return "Sin categoría"
  }

  // Group products by category name
  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>()
    for (const p of categoryFiltered) {
      const cat = getCategoryName(p)
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(p)
    }
    return map
  }, [categoryFiltered, categoryIdToName])

  const handleShowMore = (cat: string) => {
    setVisibleCounts((prev) => ({ ...prev, [cat]: (prev[cat] ?? 8) + 8 }))
  }

  // Ensure newly seen categories start with exactly 8 visible items
  useEffect(() => {
    const keys = Array.from(grouped.keys())
    setVisibleCounts((prev) => {
      const next = { ...prev }
      let changed = false
      for (const k of keys) {
        if (next[k] == null) {
          next[k] = 8
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [grouped])

  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Cargando productos...</div>}>
    <div className="container mx-auto px-3 sm:px-4 py-4 md:py-6 flex gap-4">
      {/* Left: Categories list */}
      <aside className="hidden md:block w-64 shrink-0 sticky top-24 z-40 self-start pb-4">
        <div className="pt-3">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Categorías</div>
          <div className="pr-1 max-h-[calc(100vh-6rem-2rem)] overflow-y-auto space-y-1">
            <Link
              href={`/gremio`}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${!selectedCategory ? "bg-red-600 text-white dark:bg-red-700" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
            >
              <Boxes className="h-4 w-4" />
              Todas
            </Link>
            {categories
              .slice()
              .sort((a, b) => {
                const ka = getCategoryOrderKey(a.name)
                const kb = getCategoryOrderKey(b.name)
                return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1].localeCompare(kb[1])
              })
              .map((cat) => (
              <Link
                key={cat.id}
                href={`/gremio?category=${encodeURIComponent(cat.name)}`}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${selectedCategory?.toLowerCase() === cat.name.toLowerCase() ? "bg-red-600 text-white dark:bg-red-700" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`}
                title={cat.name}
              >
                {(() => { const Icon = getCategoryIcon(cat.name); return <Icon className="h-4 w-4" /> })()}
                <span className="truncate">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </aside>

      {/* Right: Content */}
      <div className="flex-1 space-y-4">
        {/* Mobile categories scroller */}
        <div className="md:hidden -mx-3 px-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <Link
              href={`/gremio`}
              className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs border ${!selectedCategory ? "bg-red-600 text-white border-red-600" : "text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"}`}
            >
              <Boxes className="h-4 w-4" />
              Todas
            </Link>
            {categories
              .slice()
              .sort((a, b) => {
                const ka = getCategoryOrderKey(a.name)
                const kb = getCategoryOrderKey(b.name)
                return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1].localeCompare(kb[1])
              })
              .map((cat) => (
              <Link
                key={cat.id}
                href={`/gremio?category=${encodeURIComponent(cat.name)}`}
                className={`flex-shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs border ${selectedCategory?.toLowerCase() === cat.name.toLowerCase() ? "bg-red-600 text-white border-red-600" : "text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700"}`}
                title={cat.name}
              >
                {(() => { const Icon = getCategoryIcon(cat.name); return <Icon className="h-4 w-4" /> })()}
                <span className="truncate max-w-[140px]">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className="sticky top-20 md:top-24 z-30 flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white dark:bg-gray-900 border-b py-2 px-2 shadow-sm">
          <div className="flex-1">
            <Input
              placeholder="Buscar productos"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={view === "cards" ? "default" : "outline"}
              onClick={() => setView("cards")}
              className={view === "cards" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              <LayoutGrid className="h-4 w-4 mr-2" />
              Rejilla
            </Button>
            <Button
              variant={view === "list" ? "default" : "outline"}
              onClick={() => setView("list")}
              className={view === "list" ? "bg-red-600 hover:bg-red-700" : ""}
            >
              <List className="h-4 w-4 mr-2" />
              Lista
            </Button>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, gi) => (
              <section key={gi} className="space-y-3">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                {view === 'cards' ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(8)].map((__, i) => (
                      <div key={i} className="rounded border dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                        <div className="aspect-square w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="mt-3 h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                        <div className="mt-2 h-3 w-3/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <div className="space-y-2">
                      {[...Array(6)].map((__, ri) => (
                        <div key={ri} className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                      ))}
                    </div>
                  </div>
                )}
              </section>
            ))}
          </div>
        ) : (
        Array.from(grouped.entries())
          .sort((a, b) => {
            const ka = getCategoryOrderKey(a[0])
            const kb = getCategoryOrderKey(b[0])
            return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1].localeCompare(kb[1])
          })
          .map(([cat, items]) => {
            const visible = visibleCounts[cat] ?? 8
            // Brand priority: iPhone, Xiaomi, Motorola first
            const getBrandPriority = (p: Product) => {
              const anyP: any = p
              const brandRaw = String(anyP?.brand || "")
              const nameRaw = String(anyP?.name || "")
              const text = `${brandRaw} ${nameRaw}`.toLowerCase()
              if (/iphone|apple/.test(text)) return 1
              if (/xiaomi|redmi|mi\b/.test(text)) return 2
              if (/motorola|moto\b/.test(text)) return 3
              return 100
            }
            const itemsSorted = items.slice().sort((a, b) => {
              const la = ((a as any)?.liquidation ? 0 : 1)
              const lb = ((b as any)?.liquidation ? 0 : 1)
              if (la !== lb) return la - lb
              const pa = getBrandPriority(a)
              const pb = getBrandPriority(b)
              if (pa !== pb) return pa - pb
              return String((a as any)?.name || "").localeCompare(String((b as any)?.name || ""))
            })
            const toShow = itemsSorted.slice(0, visible)

            return (
              <section key={cat} className="space-y-3 rounded-lg border dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
                  <h2 className="text-base font-semibold tracking-tight">
                    {cat}
                    <span className="ml-2 inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-600 dark:text-gray-300">{items.length}</span>
                  </h2>
                </div>

                {view === "cards" ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {toShow.map((p) => (
                      <ProductCard
                        key={String(p.id)}
                        product={p}
                        onClick={() => router.push(`/products/${p.id}`)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left border-b">
                          <th className="py-2 pr-4">Producto</th>
                          <th className="py-2 pr-4">Marca</th>
                          <th className="py-2 pr-4">Categoría</th>
                          <th className="py-2 pr-4">Precio</th>
                          <th className="py-2 pr-4">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {toShow.map((p) => (
                          <tr key={String(p.id)} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-2 pr-4 max-w-[420px]">
                              <div className="flex items-center gap-3">
                                <img
                                  src={(p as any)?.image1 || (p as any)?.images?.[0] || "/placeholder.svg"}
                                  alt={p.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                                <div className="truncate">
                                  <div className="font-medium truncate">{p.name}</div>
                                  <div className="text-xs text-gray-500 truncate">{p.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2 pr-4">{(p as any)?.brand || "-"}</td>
                            <td className="py-2 pr-4">{getCategoryName(p)}</td>
                            <td className="py-2 pr-4 whitespace-nowrap">
                              {p.price} {(p as any)?.currency || "USD"}
                            </td>
                            <td className="py-2 pr-4">{(p as any)?.isInStock ? ((p as any)?.quantity ?? "✔") : "Sin stock"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {items.length > visible && (
                  <div className="pt-3">
                    <Button className="w-full" variant="default" onClick={() => handleShowMore(cat)}>
                      Ver más
                    </Button>
                  </div>
                )}
              </section>
            )
          }) )}
      </div>
    </div>
    </Suspense>
  )
}
