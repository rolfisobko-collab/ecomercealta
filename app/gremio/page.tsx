"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ProductCard from "@/components/product/ProductCard"
import { productService } from "@/services/hybrid/productService"
import type { Product } from "@/models/Product"
import Link from "next/link"
import { Boxes, LayoutGrid, List, Smartphone, Battery, Headphones, Camera, Cpu, Monitor, Plug, Shield, Wrench, Package, Mic, Speaker, Watch, CreditCard, Cpu as CpuChip, Radio, Flashlight, ShoppingBag, PanelLeft } from "lucide-react"
import { getIconByKey } from "@/utils/categoryIcons"
import { useCatalogCache } from "@/hooks/useCatalogCache"
import { useCategories } from "@/hooks/useCategories"
import { getExchangeRate } from "@/utils/currencyUtils"
import { useCurrency } from "@/context/CurrencyContext"
import { fetchExchangeRate } from "@/utils/currencyUtils"
import { useCart } from "@/context/CartContext"

export const dynamic = 'force-dynamic'

const ALL_CATEGORIES_ICON_URL = 'https://i.ibb.co/MxDxn6B1/image.png'

export default function GremioProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [view, setView] = useState<"cards" | "list">("cards")
  const [q, setQ] = useState("")
  const [sortMode, setSortMode] = useState<"relevance" | "newest" | "priceAsc" | "priceDesc">("relevance")
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || ""
  const [categoryNameToId, setCategoryNameToId] = useState<Record<string, string>>({})
  const [categories, setCategories] = useState<{ id: string; name: string; icon?: string }[]>([])
  const [categoryIdToName, setCategoryIdToName] = useState<Record<string, string>>({})
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({})
  const { currency } = useCurrency()
  const [exchangeRate, setExchangeRate] = useState<number>(() => getExchangeRate('USD','ARS'))
  const [rateLoaded, setRateLoaded] = useState<boolean>(false)
  const { addItem } = useCart()
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null)
  const [mobileCatOpen, setMobileCatOpen] = useState(false)
  const [mobileCatExpanded, setMobileCatExpanded] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartWidthRef = useRef<number>(0)
  const MIN_SIDEBAR_W = 64 // px (w-16)
  const MAX_SIDEBAR_W = 224 // px (w-56)
  const [mobileCatWidth, setMobileCatWidth] = useState<number>(MIN_SIDEBAR_W)

  // Mobile fullscreen overlay (categories)
  const [bannerExpanded, setBannerExpanded] = useState(false)
  const swipeStartYRef = useRef<number | null>(null)
  const swipeStartXRef = useRef<number | null>(null)
  const [mounted, setMounted] = useState(false)
  const fixedBarRef = useRef<HTMLDivElement | null>(null)
  const [fixedBarH, setFixedBarH] = useState<number>(56)
  const [overlayTop, setOverlayTop] = useState<number>(64)
  const [overlayAvail, setOverlayAvail] = useState<number>(600)
  const [overlayProgress, setOverlayProgress] = useState<number>(0) // 0..1

  useEffect(() => { setMounted(true) }, [])

  // Measure fixed/sticky mobile selector bar geometry for exact alignment
  useEffect(() => {
    const measure = () => {
      const el = fixedBarRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (el.offsetHeight > 0) setFixedBarH(el.offsetHeight)
      if (rect.bottom > 0) setOverlayTop(rect.bottom)
      const winH = typeof window !== 'undefined' ? window.innerHeight : 0
      if (winH > 0 && rect.bottom >= 0) setOverlayAvail(Math.max(0, winH - rect.bottom))
    }
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, { passive: true })
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure)
    }
  }, [])

  // Ensure overlay top aligns immediately when it opens
  useEffect(() => {
    if (!bannerExpanded) return
    const el = fixedBarRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    if (rect.bottom > 0) setOverlayTop(rect.bottom)
    const winH = typeof window !== 'undefined' ? window.innerHeight : 0
    if (winH > 0 && rect.bottom >= 0) setOverlayAvail(Math.max(0, winH - rect.bottom))
  }, [bannerExpanded])

  // Lock scroll while overlay is open
  useEffect(() => {
    if (!mounted) return
    const body = document.body
    if (bannerExpanded) {
      const prev = body.style.overflow
      body.style.overflow = 'hidden'
      return () => { body.style.overflow = prev }
    }
  }, [bannerExpanded, mounted])

  // Sync query from URL (?q=...)
  useEffect(() => {
    const qp = searchParams.get("q") || ""
    setQ(qp)
  }, [searchParams])

  // Feed products from catalog cache (IndexedDB) with background sync
  const catalog = useCatalogCache()
  const { categories: dbCategories } = useCategories()

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

  // Resolve category header icon by name (URL icon, keyed icon, or inferred icon)
  const renderCategoryHeaderIcon = (name: string) => {
    const match = categories.find(c => c.name.toLowerCase() === name.toLowerCase())
    if (match?.icon) {
      const isUrl = match.icon.startsWith('http') || match.icon.startsWith('data:')
      if (isUrl) return <img src={match.icon} alt={name} className="h-6 w-6 md:h-7 md:w-7 object-contain rounded-sm" />
      const Icon = getIconByKey(match.icon)
      return <Icon className="h-5 w-5 text-gray-700 dark:text-gray-200" />
    }
    const Fallback = getCategoryIcon(name)
    return <Fallback className="h-5 w-5 text-gray-700 dark:text-gray-200" />
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

  // Feed products from catalog cache (instant) and reflect its loading
  useEffect(() => {
    setProducts(catalog.products as any)
    setLoading(catalog.loading && (catalog.products?.length ?? 0) === 0)
  }, [catalog.products, catalog.loading])

  // Load exchange rate for ARS formatting
  useEffect(() => {
    const loadRate = async () => {
      try {
        const rate = await fetchExchangeRate()
        if (rate) {
          setExchangeRate((prev) => {
            if (typeof prev === 'number' && prev > 0) {
              const delta = Math.abs(rate - prev) / prev
              if (delta < 0.01) return prev // cambios <1%: no actualizar para evitar pestañeo
            }
            return rate
          })
        }
      } catch {}
      finally {
        setRateLoaded(true)
      }
    }
    loadRate()
  }, [])

  const formatPrice = (p: Product) => {
    const anyP: any = p
    const price = Number(anyP?.price || 0)
    const pCur = anyP?.currency || 'USD'
    // Convert only USD->ARS when user selects ARS (same as ProductCard)
    if (currency === 'ARS' && pCur === 'USD') {
      const ars = price * exchangeRate
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(ars)
    }
    // Otherwise, show product currency as-is
    const finalCurrency = pCur === 'ARS' ? 'ARS' : 'USD'
    const locale = finalCurrency === 'ARS' ? 'es-AR' : 'en-US'
    return new Intl.NumberFormat(locale, { style: 'currency', currency: finalCurrency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price)
  }

  const calcPoints = (p: Product) => {
    const anyP: any = p
    if (Boolean(anyP?.isReward)) return 0
    const stored = Number(anyP?.points)
    if (!Number.isNaN(stored) && stored > 0) return Math.round(stored)
    const price = Number(anyP?.price || 0)
    const pCur = String(anyP?.currency || 'USD')
    const rate = Number(exchangeRate) || 1
    // Points from displayed sale price in USD
    const saleUSD = pCur === 'ARS' ? (rate > 0 ? price / rate : price) : price
    return Math.max(0, Math.round(saleUSD * 100))
  }

  // Feed categories from DB hook (fresh) and compute maps
  useEffect(() => {
    const list = (dbCategories || []).map(c => ({ id: String((c as any).id), name: String((c as any).name || ''), icon: String(((c as any).icon || '')) || undefined }))
    setCategories(list)
    const map: Record<string, string> = {}
    for (const c of list) {
      const name = c.name.toLowerCase()
      if (name && c.id) map[name] = c.id
    }
    setCategoryNameToId(map)
    const reverse: Record<string, string> = {}
    for (const item of list) reverse[item.id] = item.name
    setCategoryIdToName(reverse)
  }, [dbCategories])

  // Fallback: if cache is empty on first load, fetch directly from API/service so users see products immediately
  useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      try {
        // Only if we still have no products
        if ((products?.length ?? 0) === 0 && (catalog.products?.length ?? 0) === 0) {
          const list = await productService.getAll()
          if (!cancelled && Array.isArray(list) && list.length > 0) {
            setProducts(list as any)
            setLoading(false)
          }
        }
      } catch {}
    }
    bootstrap()
    return () => { cancelled = true }
    // Run once on mount and whenever cache emptiness persists
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const CategoryTile = ({ id, name, icon }: { id: string; name: string; icon?: string }) => {
    const isUrlIcon = !!icon && (icon.startsWith('http') || icon.startsWith('data:'))
    const Icon = !isUrlIcon && icon ? getIconByKey(icon) : getCategoryIcon(name)
    const isActive = !!selectedCategory && selectedCategory.toLowerCase() === name.toLowerCase()
    return (
      <button
        onClick={() => router.push(`/gremio?category=${encodeURIComponent(name)}`)}
        className={`group relative flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-200 border overflow-visible
        ${isActive
          ? 'bg-gradient-to-b from-red-50 to-rose-50 border-red-300 shadow-[0_6px_24px_rgba(255,0,0,0.15)] scale-[1.03] dark:from-red-600/30 dark:to-red-500/20 dark:border-red-400 dark:shadow-[0_0_20px_rgba(255,0,0,0.4)]'
          : 'bg-gradient-to-b from-white to-gray-50 border-gray-200 hover:border-red-400 hover:shadow-[0_10px_30px_rgba(255,0,0,0.12)] hover:scale-[1.02] dark:from-gray-900 dark:to-gray-800 dark:border-gray-700 dark:hover:border-red-500 dark:hover:shadow-[0_0_25px_rgba(255,0,0,0.35)]'}
      `}
        title={name}
      >
        <div className={`rounded-2xl p-0 mb-2 transition-all duration-200 bg-white group-hover:bg-white group-hover:rotate-1 group-hover:scale-105 shadow-sm ${isActive ? 'ring-1 ring-red-200 dark:shadow-[0_0_30px_rgba(255,0,0,0.55)] dark:bg-black/20' : 'hover:shadow-md dark:shadow-[0_0_15px_rgba(0,0,0,0.4)] dark:bg-black/20'}`}>
          <div className="w-16 h-16 rounded-2xl overflow-hidden">
            {isUrlIcon ? (
              <img src={icon!} alt={name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Icon className={`h-10 w-10 ${isActive ? 'text-red-600 dark:text-red-300' : 'text-gray-700 group-hover:text-red-600 dark:text-gray-300 dark:group-hover:text-red-400'}`} />
              </div>
            )}
          </div>
        </div>
        <span className={`text-sm font-semibold tracking-wide text-center px-1 min-h-[2.25rem] flex items-center justify-center ${isActive ? 'text-red-700 dark:text-red-200' : 'text-gray-800 group-hover:text-gray-900 dark:text-gray-200 dark:group-hover:text-white'}`}>{name}</span>
        <div className="mt-1 h-0.5 w-8 bg-gradient-to-r from-transparent via-red-500/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    )
  }

  // Apply sorting mode before grouping
  const filteredSorted = useMemo(() => {
    const list = filtered.slice()
    if (sortMode === "newest") {
      return list.sort((a, b) => new Date((b as any)?.createdAt || 0).getTime() - new Date((a as any)?.createdAt || 0).getTime())
    }
    if (sortMode === "priceAsc") {
      return list.sort((a, b) => Number((a as any)?.price || 0) - Number((b as any)?.price || 0))
    }
    if (sortMode === "priceDesc") {
      return list.sort((a, b) => Number((b as any)?.price || 0) - Number((a as any)?.price || 0))
    }
    // relevance (keep liquidation first then brand/name as before)
    return list
  }, [filtered, sortMode])

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
    // 3) Si category parece un nombre legible (no ID-like), usarlo
    if (anyP?.category && typeof anyP.category === 'string') {
      const raw = String(anyP.category)
      // ID-like heurística: muy largo o solo alfanumérico sin espacios y > 16 chars
      const looksId = /^[A-Za-z0-9_-]{16,}$/.test(raw)
      if (!looksId && /[A-Za-z]/.test(raw)) return raw
    }
    // 4) Evitar mostrar IDs crudos; si no hay mapeo, mostrar placeholder estable
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

  const totalProducts = filteredSorted.length
  const totalCategories = categories.length

  // Determine readiness to render list without flicker
  const categoryReady = useMemo(() => {
    // If we have categories OR we have products, render immediately
    if ((categories?.length || 0) > 0) return true
    if ((filteredSorted?.length || 0) > 0) return true
    return false
  }, [categories, filteredSorted])

  const ready = rateLoaded && categoryReady

  return (
    <div className={`mx-auto w-full px-0 sm:px-0 py-1 md:py-2 flex ${mobileCatOpen ? 'flex-row' : 'flex-col'} md:flex-row ${mobileCatOpen ? 'gap-0' : 'gap-2'} md:gap-3`}>
      {!ready ? (
        <div className="flex-1 space-y-6">
          {[...Array(2)].map((_, gi) => (
            <section key={gi} className="space-y-3">
              <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(8)].map((__, i) => (
                  <div key={i} className="rounded border dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                    <div className="aspect-square w-full bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="mt-3 h-4 w-5/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                    <div className="mt-2 h-3 w-3/6 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
      <>
      {/* Left: Categories list */}
      <aside className="hidden md:block md:w-56 lg:w-60 shrink-0 sticky top-16 z-40 self-start pb-3">
        <div className="pt-3 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md shadow-md">
          <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 pl-1 pr-2">Categorías</div>
          <div className="h-[calc(100svh-6rem)] overflow-y-auto pl-1 pr-2 py-1">
            <div className="overflow-visible space-y-3">
            <button
              onClick={() => router.push(`/gremio`)}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-3 transition-all duration-200 text-sm
              ${!selectedCategory
                ? 'bg-gray-50 text-gray-900 dark:bg-gray-800/40 dark:text-gray-100'
                : 'bg-white hover:bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}
            `}
              title="Todas"
            >
              <div className="flex items-center gap-3">
                <img src={ALL_CATEGORIES_ICON_URL} alt="Todas" className="h-7 w-7 object-contain" />
                <span className="font-semibold">Todas las categorías</span>
              </div>
              <span className="text-xs opacity-70">{categories.length}</span>
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 overflow-visible">
              {categories
                .slice()
                .sort((a, b) => {
                  const ka = getCategoryOrderKey(a.name)
                  const kb = getCategoryOrderKey(b.name)
                  return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1].localeCompare(kb[1])
                })
                .map((cat) => (
                  <CategoryTile key={cat.id} id={cat.id} name={cat.name} icon={cat.icon} />
                ))}
            </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile left sidebar (next to products) */}
      {mobileCatOpen && (
        <aside
          className={`md:hidden shrink-0 sticky top-16 z-30 self-start pb-1 transition-[width] duration-150 ease-out`}
          style={{ width: `${mobileCatWidth}px` }}
          onTouchStart={(e) => {
            touchStartXRef.current = e.touches[0].clientX
            touchStartWidthRef.current = mobileCatWidth
          }}
          onTouchMove={(e) => {
            const x = e.touches[0].clientX
            if (touchStartXRef.current == null) { touchStartXRef.current = x; return }
            const delta = x - touchStartXRef.current
            const next = Math.max(MIN_SIDEBAR_W, Math.min(MAX_SIDEBAR_W, touchStartWidthRef.current + delta))
            setMobileCatWidth(next)
            setMobileCatExpanded(next > (MIN_SIDEBAR_W + 24))
          }}
        >
          <div className="pt-2 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md shadow-md">
            <div className={`text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2 pl-1 pr-2 ${mobileCatExpanded ? 'block' : 'hidden'}`}>Categorías</div>
            <div className="h-[calc(100svh-6rem)] overflow-y-auto pl-1 pr-2 py-1">
              <div className="overflow-visible space-y-3">
                {mobileCatExpanded ? (
                  <div className="px-1 flex items-center justify-between">
                    <Button variant="ghost" size="sm" className="rounded-full text-xs bg-gray-100 dark:bg-gray-800" onClick={() => setMobileCatOpen(false)}>
                      Volver a banner
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0"
                      aria-label="Abrir categorías a pantalla completa"
                      onClick={() => setBannerExpanded(true)}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 p-0"
                      aria-label="Volver a banner"
                      onClick={() => setMobileCatOpen(false)}
                    >
                      <PanelLeft className="h-5 w-5" />
                    </Button>
                  </div>
                )}
                <button
                  onClick={() => router.push(`/gremio`)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-3 transition-all duration-200 text-sm
              ${!selectedCategory
                ? 'bg-gray-50 text-gray-900 dark:bg-gray-800/40 dark:text-gray-100'
                : 'bg-white hover:bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}
             `}
                  title="Todas"
                >
                  <div className="flex items-center gap-3">
                    <img src={ALL_CATEGORIES_ICON_URL} alt="Todas" className="h-8 w-8 object-contain" />
                    <span className={`font-semibold ${mobileCatExpanded ? 'block' : 'hidden'}`}>Todas las categorías</span>
                  </div>
                  <span className={`text-xs opacity-70 ${mobileCatExpanded ? 'inline' : 'hidden'}`}>{categories.length}</span>
                </button>
                <div className="grid grid-cols-1 gap-1 overflow-visible px-1">
                  {categories
                    .slice()
                    .sort((a, b) => {
                      const ka = getCategoryOrderKey(a.name)
                      const kb = getCategoryOrderKey(b.name)
                      return ka[0] !== kb[0] ? ka[0] - kb[0] : ka[1].localeCompare(kb[1])
                    })
                    .map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => router.push(`/gremio?category=${encodeURIComponent(cat.name)}`)}
                        className={`w-full flex items-center ${mobileCatExpanded ? 'gap-3 px-2 py-2' : 'justify-center p-1'} rounded-lg text-sm transition-colors ${selectedCategory?.toLowerCase() === cat.name.toLowerCase() ? 'bg-red-50 text-red-700 dark:bg-red-600/20 dark:text-red-200' : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-800 dark:text-gray-200'}`}
                        title={cat.name}
                      >
                        {(() => {
                          const isUrl = !!cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:'))
                          if (isUrl) return <img src={cat.icon!} alt={cat.name} className="h-8 w-8 object-cover rounded" />
                          const Icon = cat.icon ? getIconByKey(cat.icon) : getCategoryIcon(cat.name)
                          return <Icon className={`h-8 w-8 ${selectedCategory?.toLowerCase() === cat.name.toLowerCase() ? 'text-red-600 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`} />
                        })()}
                        <span className={`font-medium truncate ${mobileCatExpanded ? 'inline' : 'hidden'}`}>{cat.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </aside>
      )}

      {/* Right: Content */}
      <div className={`flex-1 ${mobileCatOpen ? 'space-y-3' : 'space-y-4'}`}>
        {/* Mobile: fixed controls under navbar (categories + search + view toggle) */}
        {!mobileCatOpen && (
        <div
          ref={fixedBarRef}
          className="md:hidden fixed left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/90 backdrop-blur"
          style={{ top: `4rem` }}
        >
          {/* Categories row */}
          <div
            className="flex items-center gap-2 overflow-x-auto px-2 py-0 snap-x snap-mandatory"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            onTouchStart={(e) => { swipeStartYRef.current = e.touches[0].clientY; swipeStartXRef.current = e.touches[0].clientX }}
            onTouchMove={(e) => {
              if (swipeStartYRef.current == null) return
              const dy = e.touches[0].clientY - swipeStartYRef.current
              const dx = (swipeStartXRef.current == null) ? 0 : (e.touches[0].clientX - swipeStartXRef.current)
              // Open only on clear downward swipe (not horizontal scroll)
              if (dy > 8 && Math.abs(dy) > Math.abs(dx) * 2) {
                e.preventDefault()
                const p = Math.max(0, Math.min(1, dy / Math.max(1, overlayAvail)))
                setOverlayProgress(p)
              }
            }}
            onTouchEnd={() => {
              if (overlayProgress > 0.5) {
                setBannerExpanded(true)
                setOverlayProgress(1)
              } else {
                setBannerExpanded(false)
                setOverlayProgress(0)
              }
              swipeStartYRef.current = null; swipeStartXRef.current = null
            }}
          >
  {/* Apple-like toggle to open sidebar */}
            <button
              onClick={() => setMobileCatOpen((v) => !v)}
              aria-label="Abrir categorías"
              className="flex-shrink-0 snap-start inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-white/80 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 shadow-sm active:scale-95"
            >
              <PanelLeft className="h-6 w-6 text-gray-700 dark:text-gray-200" />
            </button>
            {!bannerExpanded && (
              <>
                <Link
                  href={`/gremio`}
                  className={`flex-shrink-0 snap-start inline-flex flex-col items-center justify-center gap-1 text-xs ${!selectedCategory ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}
                  title="Todas"
                >
                  <img src={ALL_CATEGORIES_ICON_URL} alt="Todas" className="h-12 w-12 object-contain" />
                  <span className="truncate max-w-[90px] text-center">Todas</span>
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
                      className={`flex-shrink-0 snap-start inline-flex flex-col items-center justify-center gap-1 text-xs ${selectedCategory?.toLowerCase() === cat.name.toLowerCase() ? "text-red-700" : "text-gray-700 dark:text-gray-300"}`}
                      title={cat.name}
                    >
                      {(() => {
                        const isUrl = !!cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:'))
                        if (isUrl) return <img src={cat.icon!} alt={cat.name} className="h-11 w-11 object-cover rounded" />
                        const Icon = cat.icon ? getIconByKey(cat.icon) : getCategoryIcon(cat.name)
                        return <Icon className={`h-11 w-11 ${selectedCategory?.toLowerCase() === cat.name.toLowerCase() ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`} />
                      })()}
                      <span className="truncate max-w-[100px] text-center">{cat.name}</span>
                    </Link>
                  ))}
              </>
            )}
            {/* (no button, swipe to open) */}
          </div>
          {/* Fullscreen overlay via portal */}
          {mounted && (bannerExpanded || overlayProgress > 0) && createPortal(
            <div
              className="fixed inset-0 z-[100] pointer-events-auto"
              onTouchStart={(e) => { swipeStartYRef.current = e.touches[0].clientY }}
              onTouchMove={(e) => {
                if (swipeStartYRef.current == null) return
                const dy = e.touches[0].clientY - swipeStartYRef.current
                if (dy < 0) {
                  e.preventDefault()
                  const p = Math.max(0, Math.min(1, (bannerExpanded ? 1 : overlayProgress) + dy / Math.max(1, overlayAvail)))
                  setOverlayProgress(p)
                }
              }}
              onTouchEnd={() => {
                if (overlayProgress < 0.5) { setBannerExpanded(false); setOverlayProgress(0) } else { setBannerExpanded(true); setOverlayProgress(1) }
                swipeStartYRef.current = null
              }}
            >
              <div
                className="absolute inset-0"
                style={{ backgroundColor: `rgba(0,0,0,${0.3 * (bannerExpanded ? 1 : overlayProgress)})` }}
                onClick={() => { setBannerExpanded(false); setOverlayProgress(0) }}
              />
              <div
                className="absolute left-0 right-0 bg-white dark:bg-gray-900 shadow-2xl overflow-hidden"
                style={{ top: overlayTop, height: `${Math.max(0, overlayAvail * (bannerExpanded ? 1 : overlayProgress))}px` }}
              >
                <div className="h-full overflow-y-auto px-2 pb-20">
                  <div className="grid grid-cols-4 gap-2 pt-2">
                    <Link
                      href={`/gremio`}
                      className={`flex flex-col items-center justify-center gap-1 text-xs ${!selectedCategory ? "text-gray-900 dark:text-gray-100" : "text-gray-700 dark:text-gray-300"}`}
                      title="Todas"
                      onClick={() => setBannerExpanded(false)}
                    >
                      <img src={ALL_CATEGORIES_ICON_URL} alt="Todas" className="h-14 w-14 object-contain" />
                      <span className="truncate max-w-[90px] text-center">Todas</span>
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
                          className={`flex flex-col items-center justify-center gap-1 text-xs ${selectedCategory?.toLowerCase() === cat.name.toLowerCase() ? "text-red-700" : "text-gray-700 dark:text-gray-300"}`}
                          title={cat.name}
                          onClick={() => setBannerExpanded(false)}
                        >
                          {(() => {
                            const isUrl = !!cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('data:'))
                            if (isUrl) return <img src={cat.icon!} alt={cat.name} className="h-14 w-14 object-cover rounded" />
                            const Icon = cat.icon ? getIconByKey(cat.icon) : getCategoryIcon(cat.name)
                            return <Icon className={`h-14 w-14 ${selectedCategory?.toLowerCase() === cat.name.toLowerCase() ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`} />
                          })()}
                          <span className="truncate max-w-[90px] text-center">{cat.name}</span>
                        </Link>
                      ))}
                  </div>
                  {/* Floating close button */}
                  <button
                    type="button"
                    onClick={() => { setBannerExpanded(false); setOverlayProgress(0) }}
                    aria-label="Cerrar categorías"
                    className="fixed bottom-5 right-4 z-[105] h-10 w-10 rounded-full bg-black text-white dark:bg-white dark:text-black shadow-lg flex items-center justify-center"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>, document.body)}
        </div>
        )}
        {/* Spacer to keep content below the fixed selector (tight join) */}
        {!mobileCatOpen && (
          <div className="md:hidden" style={{ height: `${Math.max(0, fixedBarH - 10)}px` }} />
        )}
        {/* View toggle row (centered), positioned below the fixed bar */}
        {!mobileCatOpen && (
          <div className="px-2 pt-0 pb-1 flex justify-center">
            <div className="inline-flex rounded-full bg-gray-100/70 p-0.5 w-full max-w-xs">
              <Button
                variant="ghost"
                onClick={() => setView("cards")}
                className={`flex-1 rounded-full ${view === "cards" ? "bg-white shadow-sm" : "text-gray-600"}`}
                size="sm"
              >
                <LayoutGrid className="h-4 w-4 mr-2" />
                Tarjetas
              </Button>
              <Button
                variant="ghost"
                onClick={() => setView("list")}
                className={`flex-1 rounded-full ${view === "list" ? "bg-white shadow-sm" : "text-gray-600"}`}
                size="sm"
              >
                <List className="h-4 w-4 mr-2" />
                Lista
              </Button>
            </div>
          </div>
        )}
        {/* Desktop search and view controls (sticky) */}
        <div className="hidden md:flex sticky top-16 z-30 items-center gap-3 bg-white/80 dark:bg-gray-900/70 backdrop-blur-md border border-gray-200/60 dark:border-gray-800/60 py-3 px-3 shadow-sm rounded-2xl">
          <div className="flex-1">
            <Input placeholder="Buscar productos" value={q} onChange={(e) => setQ(e.target.value)} className="h-11 rounded-full bg-gray-50/70 border-0 focus-visible:ring-1 focus-visible:ring-black/20" />
          </div>
          <div className="flex gap-2">
            <div className="hidden sm:flex items-center gap-1 mr-2">
              <span className="text-xs text-gray-500">Ordenar:</span>
              <Button variant={sortMode === 'relevance' ? 'default' : 'outline'} size="sm" onClick={() => setSortMode('relevance')} className={`rounded-full px-3 ${sortMode === 'relevance' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white'}`}>Relevancia</Button>
              <Button variant={sortMode === 'newest' ? 'default' : 'outline'} size="sm" onClick={() => setSortMode('newest')} className={`rounded-full px-3 ${sortMode === 'newest' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white'}`}>Nuevos</Button>
              <Button variant={sortMode === 'priceAsc' ? 'default' : 'outline'} size="sm" onClick={() => setSortMode('priceAsc')} className={`rounded-full px-3 ${sortMode === 'priceAsc' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white'}`}>$ ↑</Button>
              <Button variant={sortMode === 'priceDesc' ? 'default' : 'outline'} size="sm" onClick={() => setSortMode('priceDesc')} className={`rounded-full px-3 ${sortMode === 'priceDesc' ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white/70 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-white'}`}>$ ↓</Button>
            </div>
            <div className="inline-flex rounded-full bg-gray-100/70 p-1">
              <Button variant="ghost" onClick={() => setView("cards")} className={`rounded-full ${view === "cards" ? 'bg-white shadow-sm' : 'text-gray-600'}`}>
                <LayoutGrid className="h-4 w-4 mr-2" /> Rejilla
              </Button>
              <Button variant="ghost" onClick={() => setView("list")} className={`rounded-full ${view === "list" ? 'bg-white shadow-sm' : 'text-gray-600'}`}>
                <List className="h-4 w-4 mr-2" /> Lista
              </Button>
            </div>
          </div>
        </div>

        {loading && products.length === 0 ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, gi) => (
              <section key={gi} className="space-y-3">
                <div className="h-5 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
                {view === 'cards' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
            // Apply sort mode inside each category for consistency
            const itemsSortedBase = items.slice().sort((a, b) => {
              const la = ((a as any)?.liquidation ? 0 : 1)
              const lb = ((b as any)?.liquidation ? 0 : 1)
              if (la !== lb) return la - lb
              const pa = getBrandPriority(a)
              const pb = getBrandPriority(b)
              if (pa !== pb) return pa - pb
              return String((a as any)?.name || "").localeCompare(String((b as any)?.name || ""))
            })
            const itemsSorted = (() => {
              if (sortMode === 'newest') return itemsSortedBase.sort((a, b) => new Date((b as any)?.createdAt || 0).getTime() - new Date((a as any)?.createdAt || 0).getTime())
              if (sortMode === 'priceAsc') return itemsSortedBase.sort((a, b) => Number((a as any)?.price || 0) - Number((b as any)?.price || 0))
              if (sortMode === 'priceDesc') return itemsSortedBase.sort((a, b) => Number((b as any)?.price || 0) - Number((a as any)?.price || 0))
              return itemsSortedBase
            })()
            const toShow = itemsSorted.slice(0, visible)

            return (
              <section key={cat} className="space-y-3 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 bg-white/60 dark:bg-gray-900/50 backdrop-blur p-3 md:p-5 shadow-sm">
                <div className="flex items-center justify-between border-b pb-3 dark:border-gray-800">
                  <h2 className="text-base font-semibold tracking-tight flex items-center gap-2">
                    {renderCategoryHeaderIcon(cat)}
                    {cat}
                    <span className="ml-2 inline-block rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300">{items.length}</span>
                  </h2>
                </div>

                {view === "cards" ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {toShow.map((p) => (
                      <ProductCard
                        key={String(p.id)}
                        product={p}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Mobile stacked list */}
                    <div className="md:hidden space-y-2">
                      {toShow.map((p) => (
                        <Link key={String(p.id)} href={`/gremio/products/${p.id}`} className="block">
                          <div className="flex items-center gap-3 border rounded-xl p-3 bg-white dark:bg-gray-900/60">
                          {(() => {
                            const src = (p as any)?.image1 || (p as any)?.images?.[0]
                            if (src) {
                              return (
                                <img
                                  src={src}
                                  alt={p.name}
                                  className="w-16 h-16 object-cover rounded-lg shadow-sm flex-shrink-0"
                                />
                              )
                            }
                            return (
                              <div className="w-16 h-16 rounded-lg shadow-sm flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 flex-shrink-0">
                                <ShoppingBag className="h-7 w-7" />
                              </div>
                            )
                          })()}
                          <div className="min-w-0 flex-1">
                            <div className="font-semibold text-sm truncate">{p.name}</div>
                            <div className="text-xs text-gray-500 truncate">{(p as any)?.brand || "-"} • {getCategoryName(p)}</div>
                            <div className="mt-1 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className={`font-bold ${ (p as any)?.liquidation ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100' }`}>
                                  {formatPrice(p)}
                                </span>
                                <span className="text-[11px] text-amber-600">Gana {calcPoints(p).toLocaleString('es-AR')} pts</span>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                  {(p as any)?.isInStock ? ((p as any)?.quantity ?? '✔') : 'Sin stock'}
                                </span>
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white rounded-full"
                                  disabled={!((p as any)?.isInStock)}
                                  onClick={() => addItem(p)}
                                >
                                  Agregar
                                </Button>
                              </div>
                            </div>
                          </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {/* Desktop table */}
                    <div className="hidden md:block w-full overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left border-b">
                            <th className="py-2 pr-4">Producto</th>
                            <th className="py-2 pr-4">Categoría</th>
                            <th className="py-2 pr-4">Precio</th>
                            <th className="py-2 pr-4">Puntos</th>
                            <th className="py-2 pr-4">Stock</th>
                            <th className="py-2 pr-2 text-right">Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {toShow.map((p) => (
                            <tr key={String(p.id)} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                              <td className="py-2 pr-4 max-w-[420px]">
                                <Link href={`/gremio/products/${p.id}`} className="flex items-center gap-3 hover:underline">
                                  {(() => {
                                    const src = (p as any)?.image1 || (p as any)?.images?.[0]
                                    if (src) {
                                      return (
                                        <img
                                          src={src}
                                          alt={p.name}
                                          className="w-12 h-12 object-cover rounded-md shadow-sm"
                                        />
                                      )
                                    }
                                    return (
                                      <div className="w-12 h-12 rounded-md shadow-sm flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400">
                                        <ShoppingBag className="h-5 w-5" />
                                      </div>
                                    )
                                  })()}
                                  <div className="truncate">
                                    <div className="font-medium truncate">{p.name}</div>
                                    <div className="text-xs text-gray-500 truncate">{p.description}</div>
                                  </div>
                                </Link>
                              </td>
                              <td className="py-2 pr-4">{getCategoryName(p)}</td>
                              <td className="py-2 pr-4 whitespace-nowrap">{formatPrice(p)}</td>
                              <td className="py-2 pr-4 whitespace-nowrap">{calcPoints(p).toLocaleString('es-AR')} pts</td>
                              <td className="py-2 pr-4">{(p as any)?.isInStock ? ((p as any)?.quantity ?? '✔') : 'Sin stock'}</td>
                              <td className="py-2 pr-2 text-right">
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-red-600 hover:bg-red-700 text-white rounded-full"
                                  disabled={!((p as any)?.isInStock)}
                                  onClick={() => addItem(p)}
                                >
                                  Agregar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {items.length > visible && (
                  <div className="pt-3 flex justify-center">
                    <Button className="h-10 rounded-full bg-black/90 hover:bg-black text-white px-6 md:px-8 min-w-[180px]" variant="default" onClick={() => handleShowMore(cat)}>
                      Ver más
                    </Button>
                  </div>
                )}
              </section>
            )
          }) )}
        </div>
        </>
      )}

      {/* Product Details Drawer within Gremio (renders real /products/[id]) */}
      {(() => {
        const [open, setOpen] = [!!selectedProduct, (v: boolean) => !v ? setSelectedProduct(null) : null]
        const p = selectedProduct
        return open && p ? (
          <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedProduct(null)} />
            <aside className="absolute right-0 top-16 bottom-0 w-full sm:w-[520px] bg-white/85 dark:bg-gray-900/85 backdrop-blur-lg border-l border-gray-200/70 dark:border-gray-800/70 rounded-l-2xl shadow-2xl flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 h-12 border-b dark:border-gray-800 bg-white/70 dark:bg-gray-900/70">
                <h3 className="text-sm font-semibold truncate pr-2">{p.name}</h3>
                <button
                  className="inline-flex h-8 items-center rounded-full border px-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setSelectedProduct(null)}
                >
                  Cerrar
                </button>
              </div>
              <div className="flex-1 overflow-hidden">
                <iframe
                  src={`/products/${(p as any)?.id}`}
                  className="w-full h-full"
                  title={`Producto ${(p as any)?.name || ''}`}
                />
              </div>
            </aside>
          </div>
        ) : null
      })()}
    </div>
  )
}
