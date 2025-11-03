"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Plus, Search, Edit, Trash2, Package, AlertCircle, Image as ImageIcon, DollarSign, Grid3x3, List, FileText, CheckSquare, Square } from "lucide-react"
import { getAllCategories } from "@/services/hybrid/categoryService"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { useCatalogCache } from "@/hooks/useCatalogCache"
import { productService } from "@/services/hybrid/productService"
import { onProductsUpdate } from "@/services/hybrid/productService"
import { updateProductStock } from "@/services/hybrid/productService"
// removed skeleton loader per request

interface Product {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  category: string
  brand?: string
  model?: string
  images: string[]
  image1?: string
  location?: string
  liquidation?: boolean
  weeklyOffer?: boolean
  updatedAt?: string | Date
  createdAt?: string | Date
  points?: number
  isReward?: boolean
  redeemPoints?: number
}

export default function ProductsPage() {
  const catalog = useCatalogCache()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState(() => {
    try { return JSON.parse(localStorage.getItem('admin_products_filters') || '{}')?.searchTerm || "" } catch { return "" }
  })
  const [categoryFilter, setCategoryFilter] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('admin_products_filters') || '{}')?.categoryFilter || "all" } catch { return "all" }
  })
  const [stockFilter, setStockFilter] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('admin_products_filters') || '{}')?.stockFilter || "all" } catch { return "all" }
  })
  const [imageFilter, setImageFilter] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('admin_products_filters') || '{}')?.imageFilter || "all" } catch { return "all" }
  })
  const [priceFilter, setPriceFilter] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('admin_products_filters') || '{}')?.priceFilter || "all" } catch { return "all" }
  })
  const [liquidationFilter, setLiquidationFilter] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('admin_products_filters') || '{}')?.liquidationFilter || "all" } catch { return "all" }
  })
  const [weeklyFilter, setWeeklyFilter] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('admin_products_filters') || '{}')?.weeklyFilter || "all" } catch { return "all" }
  })
  const [locationFilter, setLocationFilter] = useState<string>(() => {
    try { return JSON.parse(localStorage.getItem('admin_products_filters') || '{}')?.locationFilter || "all" } catch { return "all" }
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const { toast } = useToast()

  // Progressive loading controls
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const PAGE_SIZE = 500
  const autoLoadRef = useRef(false)
  const hasMoreRef = useRef(true)
  const isLoadingMoreRef = useRef(false)
  const resetInFlightRef = useRef<AbortController | null>(null)

  // Función para formatear fecha
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Actualiza un campo específico del producto (sin recargar la página)
  const updateProductField = async (productId: string, field: string, value: any) => {
    try {
      const payload: any = {
        id: productId,
        updatedAt: new Date(),
      }
      // normalizar numéricos
      payload[field] = (field === 'price' || field === 'quantity')
        ? Number(value)
        : value

      // Si marcamos flags de featured, enviar datos extra para espejado inmediato
      if (field === 'liquidation' || field === 'weeklyOffer') {
        const p = products.find(x => x.id === productId)
        if (p) {
          payload.name = p.name
          if (typeof p.price === 'number') payload.price = p.price
          if (p.image1) payload.image1 = p.image1
          if (Array.isArray(p.images)) payload.images = p.images
        }
      }

      // Si cambia el precio, recalcular puntos = precio * 100 y setear redeemPoints si es premio y no tiene
      if (field === 'price') {
        const pr = Number(String(value).toString().replace(/[^0-9.-]/g,''))
        const pts = Math.max(0, Math.round(pr * 100))
        ;(payload as any).points = pts
        const curr = products.find(x => x.id === productId)
        const isReward = Boolean((curr as any)?.isReward)
        const hasRedeem = Number((curr as any)?.redeemPoints || 0) > 0
        if (isReward && !hasRedeem) {
          ;(payload as any).redeemPoints = pts * 9
        }
      }

      // Si se marca como premio, garantizar puntos de canje (price*100 si faltan o son 0)
      if (field === 'isReward' && Boolean(value)) {
        const curr = products.find(x => x.id === productId)
        const existingPts = Number((curr as any)?.points || 0)
        if (!existingPts || existingPts <= 0) {
          const pr = Number(String((curr as any)?.price || 0).toString().replace(/[^0-9.-]/g,''))
          const pts = Math.max(0, Math.round(pr * 100))
          ;(payload as any).points = pts
          ;(payload as any).redeemPoints = pts * 9
        } else if (!((curr as any).redeemPoints || 0)) {
          ;(payload as any).redeemPoints = existingPts * 9
        }
      }

      const ok = await productService.updateProduct(productId, payload)
      if (!ok) throw new Error('Error al actualizar producto')

      // Optimistic update
      setProducts(prev => prev.map(p => {
        if (p.id !== productId) return p
        const next: any = { ...p, [field]: payload[field], updatedAt: payload.updatedAt }
        if ((payload as any).points !== undefined) next.points = (payload as any).points
        if ((payload as any).redeemPoints !== undefined) next.redeemPoints = (payload as any).redeemPoints
        // También mantener un 'cost' local si se editó para futuros cálculos
        if (field === 'cost') (next as any).cost = payload[field]
        if (field === 'price') (next as any).price = payload[field]
        return next
      }))

      // Notificar a otras pestañas/secciones (POS ventas) para refrescar al instante
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('admin-products')
          bc.postMessage({ type: 'product-updated', id: productId, field, value: payload[field] })
          // Cerrar el canal rápidamente para no filtrar recursos
          setTimeout(() => bc.close(), 0)
        } else {
          // Fallback: usar localStorage event
          const key = 'admin_products_last_update'
          localStorage.setItem(key, JSON.stringify({ t: Date.now(), id: productId, field }))
        }
      } catch {}

      // Silencioso: no mostrar alert/Toast al guardar correctamente
    } catch (e) {
      console.error('updateProductField error:', e)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el producto',
        variant: 'destructive',
      })
    }
  }

  // Edición inline: helpers para blur/Enter
  const commitOnEnter = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
      e.preventDefault()
    }
  }

  // Require double-click to edit: track which field is in editing mode
  const [editing, setEditing] = useState<Set<string>>(new Set())
  const editKey = (id: string, field: string) => `${id}:${field}`
  const isEditing = (id: string, field: string) => editing.has(editKey(id, field))
  const enableEditing = (id: string, field: string) => {
    setEditing((prev) => new Set(prev).add(editKey(id, field)))
  }
  const disableEditing = (id: string, field: string) => {
    setEditing((prev) => {
      const next = new Set(prev)
      next.delete(editKey(id, field))
      return next
    })
  }

  // Progressive fetcher from API
  const fetchProducts = useMemo(() => {
    return async ({ reset = false }: { reset?: boolean } = {}) => {
      try {
        if (reset) {
          // Prevent overlapping resets
          if (resetInFlightRef.current) {
            resetInFlightRef.current.abort()
          }
          const aborter = new AbortController()
          resetInFlightRef.current = aborter
          setLoading(true)
          setSkip(0)
          autoLoadRef.current = false
          // Bulk fetch all (up to 100k)
          const params = new URLSearchParams()
          params.set('limit', String(100000))
          params.set('skip', '0')
          // Fetch ALL on reset; apply filters client-side

          const data = await productService.getAll()
          const list: Product[] = Array.isArray(data) ? data.map((p: any) => ({
            id: String(p.id || p._id),
            name: p.name || '',
            description: p.description || '',
            price: Number(p.price || 0),
            quantity: getQty(p),
            category: String(p.category ?? p.categoryId ?? ''),
            brand: p.brand,
            model: p.model,
            images: Array.isArray(p.images) ? p.images : [],
            image1: p.image1,
            location: String(p.location ?? p.ubicacion ?? ''),
            liquidation: Boolean((p as any).liquidation ?? false),
            weeklyOffer: Boolean((p as any).weeklyOffer ?? false),
            updatedAt: p.updatedAt,
            createdAt: p.createdAt,
            points: Number(p.price || 0) * 100,
            isReward: Boolean((p as any).isReward ?? false),
            redeemPoints: Number((p as any).redeemPoints ?? 0)
          })) : []

          // Only apply if not aborted
          if (!aborter.signal.aborted) {
            setProducts(list)
          }
          setHasMore(false)
          hasMoreRef.current = false
          setLoading(false)
          if (resetInFlightRef.current === aborter) resetInFlightRef.current = null
          return
        } else {
          // Allow internal autoload to proceed even if a batch is in progress
          if (!autoLoadRef.current && (isLoadingMoreRef.current || !hasMoreRef.current)) return
          if (!isLoadingMoreRef.current) {
            setIsLoadingMore(true)
            isLoadingMoreRef.current = true
          }
        }

        const currentSkip = reset ? 0 : skip
        const params = new URLSearchParams()
        params.set('limit', String(PAGE_SIZE))
        params.set('skip', String(currentSkip))
        const q = searchTerm.trim()
        if (q) params.set('q', q)
        if (categoryFilter !== 'all') params.set('category', categoryFilter)

        const data = await productService.getAll()
        const list: Product[] = Array.isArray(data) ? data.map((p: any) => ({
          id: String(p.id || p._id),
          name: p.name || '',
          description: p.description || '',
          price: Number(p.price || 0),
          quantity: getQty(p),
          category: String(p.category ?? p.categoryId ?? ''),
          brand: p.brand,
          model: p.model,
          images: Array.isArray(p.images) ? p.images : [],
          image1: p.image1,
          location: String(p.location ?? p.ubicacion ?? ''),
          liquidation: Boolean((p as any).liquidation ?? false),
          weeklyOffer: Boolean((p as any).weeklyOffer ?? false),
          updatedAt: p.updatedAt,
          createdAt: p.createdAt,
          points: Number((p as any).points ?? (() => { const pr=Number(String(p.price??0).toString().replace(/[^0-9.-]/g,'')); return Math.round(Math.max(0, pr*100)); })()),
          isReward: Boolean((p as any).isReward ?? false),
          redeemPoints: Number((p as any).redeemPoints ?? 0)
        })) : []

        setProducts(prev => {
          const map = new Map(prev.map(x => [x.id, x]))
          for (const it of list) map.set(it.id, it)
          return Array.from(map.values())
        })

        const loaded = list.length
        const nextSkip = currentSkip + loaded
        setSkip(nextSkip)
        const nextHasMore = loaded === PAGE_SIZE && list.length > 0
        setHasMore(nextHasMore)
        hasMoreRef.current = nextHasMore

        if (reset) setLoading(false)

        // keep fetching in background until all loaded
        if (!reset && hasMoreRef.current && autoLoadRef.current) {
          setTimeout(() => {
            fetchProducts({ reset: false })
          }, 0)
        }
        if (reset && hasMoreRef.current && autoLoadRef.current) {
          setTimeout(() => {
            fetchProducts({ reset: false })
          }, 0)
        }
      } catch (e) {
        if ((e as any)?.name === 'AbortError') {
          // ignore aborted request; a new reset/fetch is in-flight
          return
        }
        console.error('admin/products progressive fetch error:', e)
        if (reset) setLoading(false)
        setHasMore(false)
      } finally {
        setIsLoadingMore(false)
        isLoadingMoreRef.current = false
        setLastUpdated(new Date())
        // Chain next batch in background until all loaded
        if (autoLoadRef.current && hasMoreRef.current) {
          setTimeout(() => {
            fetchProducts({ reset: false })
          }, 0)
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, categoryFilter])

  // Load categories once
  useEffect(() => {
    // Prime from Dexie cache first (instant), then server
    if (catalog.categories && catalog.categories.length > 0) {
      setCategories(catalog.categories as any[])
    }
    getAllCategories().then(setCategories).catch(() => {
      toast({ title: 'Error', description: 'No se pudieron cargar las categorías.', variant: 'destructive' })
    })
  }, [toast, catalog.categories])

  // Bulk fetch on filter changes (and initial mount)
  useEffect(() => {
    // Prime products from Dexie cache for instant UI if empty
    if (products.length === 0 && (catalog.products?.length ?? 0) > 0) {
      const mapped = (catalog.products as any[]).map((p: any) => ({
        id: String(p.id),
        name: p.name || '',
        description: p.description || '',
        price: Number(p.price || 0),
        quantity: getQty(p),
        category: String(p.category ?? (p as any).categoryId ?? ''),
        brand: (p as any).brand,
        model: (p as any).model,
        images: Array.isArray(p.images) ? p.images : [],
        image1: (p as any).image1,
        location: String((p as any).location ?? (p as any).ubicacion ?? ''),
        liquidation: Boolean((p as any).liquidation ?? false),
        weeklyOffer: Boolean((p as any).weeklyOffer ?? false),
        updatedAt: p.updatedAt,
        createdAt: p.createdAt,
        points: Number((p as any).points ?? (() => { const pr=Number(String(p.price??0).toString().replace(/[^0-9.-]/g,'')); return Math.round(Math.max(0, pr*100)); })()),
        isReward: Boolean((p as any).isReward ?? false),
        redeemPoints: Number((p as any).redeemPoints ?? 0)
      }))
      setProducts(mapped)
    }
    fetchProducts({ reset: true })
    // no cleanup needed for bulk fetch; AbortController handles overlap
  }, [searchTerm, categoryFilter, catalog.products])

  // keep refs in sync
  useEffect(() => { 
    hasMoreRef.current = hasMore 
    if (!hasMore) autoLoadRef.current = false
  }, [hasMore])
  useEffect(() => { isLoadingMoreRef.current = isLoadingMore }, [isLoadingMore])

  // Suscripción a cambios de productos (refresca stock rápido)
  useEffect(() => {
    let stop: undefined | (() => void)
    try {
      stop = (onProductsUpdate as any)((incoming: any[]) => {
        if (!Array.isArray(incoming) || incoming.length === 0) return
        setProducts(prev => {
          const map = new Map(prev.map(p => [p.id, p]))
          for (const it of incoming) {
            const id = String((it as any).id || (it as any)._id)
            if (!id) continue
            const prevItem = map.get(id)
            if (!prevItem) continue
            const nextQty = Number((it as any).quantity ?? (it as any).stock ?? prevItem.quantity ?? 0)
            const next: any = { ...prevItem, quantity: nextQty }
            map.set(id, next)
          }
          return Array.from(map.values())
        })
      })
    } catch {}
    return () => { try { stop && stop() } catch {} }
  }, [])

  // Removed post-mount persisted filters effect to avoid triggering a second reset

  // Persist filters on change
  useEffect(() => {
    const toSave = { searchTerm, categoryFilter, stockFilter, imageFilter, priceFilter, liquidationFilter, weeklyFilter, locationFilter, viewMode }
    localStorage.setItem('admin_products_filters', JSON.stringify(toSave))
  }, [searchTerm, categoryFilter, stockFilter, imageFilter, priceFilter, liquidationFilter, weeklyFilter, locationFilter, viewMode])

  // Removed periodic refresh to avoid clearing the list after load

  // Filtrado optimizado con useMemo
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      
      const qx = getQty(product)
      const matchesStock = stockFilter === "all" ||
                          (stockFilter === "low" && qx <= 5 && qx > 0) ||
                          (stockFilter === "out" && qx === 0) ||
                          (stockFilter === "in" && qx > 5)
      
      const hasImage = product.image1 || (product.images && product.images.length > 0)
      const matchesImage = imageFilter === "all" ||
                          (imageFilter === "no-image" && !hasImage) ||
                          (imageFilter === "with-image" && hasImage)
      const hasPrice = Number(product.price || 0) > 0
      const matchesPrice = priceFilter === "all" ||
                           (priceFilter === "no-price" && !hasPrice) ||
                           (priceFilter === "with-price" && hasPrice)
      const isLiquidation = Boolean((product as any).liquidation)
      const matchesLiquidation = liquidationFilter === "all" ||
                                 (liquidationFilter === "yes" && isLiquidation) ||
                                 (liquidationFilter === "no" && !isLiquidation)
      const isWeekly = Boolean((product as any).weeklyOffer)
      const matchesWeekly = weeklyFilter === "all" ||
                            (weeklyFilter === "yes" && isWeekly) ||
                            (weeklyFilter === "no" && !isWeekly)
      const locationValue = (product as any).location || (product as any).ubicacion || ""
      const matchesLocation = locationFilter === "all" || locationValue === locationFilter
      
      return matchesSearch && matchesCategory && matchesStock && matchesImage && matchesPrice && matchesLiquidation && matchesWeekly && matchesLocation
    })
  }, [products, searchTerm, categoryFilter, stockFilter, imageFilter, priceFilter, liquidationFilter, weeklyFilter, locationFilter])

  const locationOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of products as any[]) {
      const raw = (p as any).location ?? (p as any).ubicacion
      if (!raw) continue
      const v = String(raw).trim()
      if (!v) continue
      if (v === '-' || v === '—') continue
      set.add(v)
    }
    return Array.from(set).sort()
  }, [products])

  // Clamp current page to available range when list size changes
  useEffect(() => {
    const total = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage))
    if (currentPage > total) setCurrentPage(1)
  }, [filteredProducts.length, itemsPerPage])

  // Helpers para exportaciones
  const getTargetItems = () => {
    // Si hay seleccionados, usar esos; sino, los filtrados actuales
    const selected = products.filter(p => selectedProducts.has(p.id))
    return selectedProducts.size > 0 ? selected : filteredProducts
  }

  const buildExportText = (items: Product[]) => {
    const lines = items.map(p => {
      const catName = categories.find(c => c.id === p.category)?.name || 'Sin categoría'
      const price = (p.price ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return `${p.name}\nPrecio: $${price}\nStock: ${p.quantity ?? 0}\nCategoría: ${catName}\n${'-'.repeat(50)}`
    })
    return lines.join('\n\n')
  }

  const exportTXT = () => {
    const items = getTargetItems()
    if (items.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay productos para exportar', variant: 'destructive' })
      return
    }
    const text = buildExportText(items)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productos-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    const items = getTargetItems()
    if (items.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay productos para copiar', variant: 'destructive' })
      return
    }
    const text = buildExportText(items)
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copiado', description: `Se copiaron ${items.length} productos al portapapeles` })
  }

  const exportPDF = async () => {
    try {
      const items = getTargetItems()
      if (items.length === 0) {
        toast({ title: 'Sin datos', description: 'No hay productos para exportar', variant: 'destructive' })
        return
      }

      // Intentar cargar jsPDF dinámicamente SIN que Next lo resuelva en build
      // Usamos eval(Function) para evitar el análisis estático del bundler
      const loadJsPDF = async () => {
        try {
          const mod = await (Function('return import("jspdf")')() as Promise<any>)
          return mod?.default ?? null
        } catch {
          return null
        }
      }
      // @ts-ignore opcional
      const jsPDF = await loadJsPDF()
      if (!jsPDF) {
        // Fallback a impresión en navegador
        const text = buildExportText(items).replaceAll('\n', '<br/>')
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(`<!doctype html><html><head><title>Exportación</title></head><body>`)
          win.document.write(`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">`)
          win.document.write(`<img src="/images/logo.png" alt="Logo" style="height:40px"/>`)
          win.document.write(`<h2 style="margin:0">Listado de productos (${items.length})</h2>`)
          win.document.write(`</div>`)
          win.document.write(`<div style="font-family:monospace;white-space:pre-wrap">${text}</div>`)
          win.document.write(`</body></html>`)
          win.document.close()
          win.focus()
          win.print()
        }
        toast({ title: 'jsPDF no instalado', description: 'Usé impresión del navegador como alternativa.' })
        return
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })

      // Cargar logo y transformarlo a dataURL
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
      const img = await loadImage('/images/logo.png').catch(() => null)
      if (img) {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const w = 160, h = (img.height / img.width) * 160
          canvas.width = w
          canvas.height = h
          ctx.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL('image/png')
          doc.addImage(dataUrl, 'PNG', 40, 30, w, h)
        }
      }

      let y = 40 + 60 // margen + altura estimada del logo
      doc.setFontSize(14)
      doc.text(`Listado de productos (${items.length})`, 40, y)
      y += 20
      doc.setFont('Courier', 'normal')
      doc.setFontSize(11)

      const lineHeight = 16
      items.forEach((p, idx) => {
        const catName = categories.find(c => c.id === p.category)?.name || 'Sin categoría'
        const price = (p.price ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const block = [
          `${idx + 1}. ${p.name}`,
          `Precio: $${price} | Stock: ${p.quantity ?? 0} | Cat: ${catName}`,
          ''.padEnd(60, '-')
        ]
        block.forEach(line => {
          if (y > 780) { // salto de página simple
            doc.addPage()
            y = 60
          }
          doc.text(line, 40, y)
          y += lineHeight
        })
      })

      doc.save(`productos-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      console.error('exportPDF error', e)
      toast({ title: 'Error', description: 'No se pudo generar el PDF', variant: 'destructive' })
    }
  }

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const handleDelete = async () => {
    if (!productToDelete) return
    
    setDeleting(true)
    try {
      const ok = await productService.deleteProduct(productToDelete.id)
      if (!ok) throw new Error('Delete failed')
      
      // Actualizar el estado local inmediatamente
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id))
      
      toast({
        title: "Producto eliminado",
        description: `${productToDelete.name} fue eliminado correctamente`,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || 'Sin categoría'
  }

  // Normalizador de stock (acepta múltiples esquemas)
  function getQty(obj: any): number {
    const cand = [
      obj?.quantity,
      obj?.stock,
      obj?.qty,
      obj?.cantidad,
      obj?.inventory,
      obj?.available,
      obj?.quantityAvailable,
    ]
    for (const v of cand) {
      const n = Number(v)
      if (Number.isFinite(n)) return Math.max(0, n)
    }
    // como fallback, si isInStock true y no hay número, mostrar 1 para que no quede en 0 fantasma
    if (obj?.isInStock === true) return 1
    return 0
  }

  // Ajuste instantáneo de stock con +/-
  const adjustStock = async (productId: string, delta: number) => {
    try {
      const curr = products.find(p => p.id === productId)?.quantity || 0
      const next = Math.max(0, curr + delta)
      // Optimistic UI
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, quantity: next } : p))
      await updateProductStock(productId, next)
    } catch (e) {
      console.error('adjustStock error', e)
    }
  }

  // No skeletons; show content with lightweight indicators

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const selected = products.filter(p => selectedProducts.has(p.id))
                const text = selected.map(p => 
                  `${p.name}\nPrecio: $${p.price || 0}\nStock: ${p.quantity || 0}\nCategoría: ${categories.find(c => c.id === p.category)?.name || 'Sin categoría'}\n${'-'.repeat(50)}`
                ).join('\n\n')
                
                const blob = new Blob([text], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `productos-seleccionados-${new Date().toISOString().split('T')[0]}.txt`
                a.click()
                URL.revokeObjectURL(url)
                
                toast({
                  title: "Exportado",
                  description: `${selectedProducts.size} productos exportados a TXT`
                })
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar ({selectedProducts.size})
            </Button>
          )}
          {/* Botones globales de exportación/copiar (usa seleccionados o filtrados) */}
          <Button variant="secondary" onClick={copyToClipboard}>
            Copiar al portapapeles
          </Button>
          <Button variant="outline" onClick={exportTXT}>
            Exportar TXT
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={exportPDF}>
            Exportar PDF
          </Button>
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Link href="/admin/products/new">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">En inventario</p>
          </CardContent>
        </Card>

        

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => (p.quantity || 0) <= 5 && (p.quantity || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">≤ 5 unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Imágenes</CardTitle>
            <ImageIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => !p.image1 && (!p.images || p.images.length === 0)).length}
            </div>
            <p className="text-xs text-muted-foreground">Productos sin foto</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Precio</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => !p.price || p.price === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Requieren precio</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Mobile toggle */}
          <div className="sm:hidden mb-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Filtros</span>
            <Button size="sm" variant="outline" onClick={() => setShowFiltersMobile(v => !v)}>
              {showFiltersMobile ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
          <div className={`${showFiltersMobile ? '' : 'hidden'} sm:grid grid gap-4 md:grid-cols-6`}>
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, descripción o marca..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Categoría</label>
              <Select value={categoryFilter} onValueChange={(value) => {
                setCategoryFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""))).map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Stock</label>
              <Select value={stockFilter} onValueChange={(value) => {
                setStockFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el stock</SelectItem>
                  <SelectItem value="in">Con stock (&gt;5)</SelectItem>
                  <SelectItem value="low">Stock bajo (≤5)</SelectItem>
                  <SelectItem value="out">Sin stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Imágenes</label>
              <Select value={imageFilter} onValueChange={(value) => {
                setImageFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Imágenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="no-image">Sin imágenes</SelectItem>
                  <SelectItem value="with-image">Con imágenes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Precio</label>
              <Select value={priceFilter} onValueChange={(value) => {
                setPriceFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Precio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="with-price">Con precio</SelectItem>
                  <SelectItem value="no-price">Sin precio</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Liquidación</label>
              <Select value={liquidationFilter} onValueChange={(value) => {
                setLiquidationFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Liquidación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="yes">En liquidación</SelectItem>
                  <SelectItem value="no">Sin liquidación</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Oferta de la semana</label>
              <Select value={weeklyFilter} onValueChange={(value) => {
                setWeeklyFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Oferta semana" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo</SelectItem>
                  <SelectItem value="yes">En oferta semana</SelectItem>
                  <SelectItem value="no">Sin oferta semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Ubicación</label>
              <Select value={locationFilter} onValueChange={(value) => {
                setLocationFilter(value)
                setCurrentPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Ubicación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ubicaciones</SelectItem>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Mostrando {paginatedProducts.length} de {filteredProducts.length} productos</span>
            <div className="flex items-center gap-2">
              <span>{filteredProducts.length !== products.length && `(${products.length} total)`}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setStockFilter("all")
                  setImageFilter("all")
                  setPriceFilter("all")
                  setLiquidationFilter("all")
                  setWeeklyFilter("all")
                  setLocationFilter("all")
                  setCurrentPage(1)
                }}
              >
                Borrar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden relative">
              <div className="absolute top-2 left-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  onClick={() => {
                    const newSelected = new Set(selectedProducts)
                    if (newSelected.has(product.id)) {
                      newSelected.delete(product.id)
                    } else {
                      newSelected.add(product.id)
                    }
                    setSelectedProducts(newSelected)
                  }}
                >
                  {selectedProducts.has(product.id) ? (
                    <CheckSquare className="h-4 w-4 text-red-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="aspect-square relative bg-gray-100">
                {(product.image1 || product.images?.[0]) ? (
                  <img
                    src={product.image1 || product.images[0]}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {(() => { const q = getQty(product); return q <= 5 ? (
                  <Badge className="absolute top-2 right-2" variant={q === 0 ? "destructive" : "secondary"}>
                    {q === 0 ? "Sin stock" : "Stock bajo"}
                  </Badge>
                ) : null })()}
                {product.isReward && (
                  <Badge className="absolute bottom-2 left-2 bg-amber-500 text-white" variant="default">Premio</Badge>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Categoría:</span>
                    <span className="font-medium">{getCategoryName(product.category)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    {(() => { const q = getQty(product); return (
                      <span className={`font-medium ${q <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                        {q} unidades
                      </span>
                    ) })()}
                  </div>
                  {/* sin controles rápidos, se edita solo desde el input en vista lista */}
                  <div className="flex justify-between">
                    <span>Precio:</span>
                    <span className="font-medium text-lg">${(product.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Gana:</span>
                    <span className="font-semibold">{Number(product.points || 0).toLocaleString('es-AR')} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Canje:</span>
                    <span className="font-semibold">{Number(product.redeemPoints || ((product.points || 0) * 9)).toLocaleString('es-AR')} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ubicación:</span>
                    <span className="font-medium">{String((product as any).location || (product as any).ubicacion || '—')}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href={`/admin/products/edit/${product.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setProductToDelete(product)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedProducts.map((product) => (
            <div key={product.id} className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border bg-white dark:bg-gray-900">
              <div className="flex items-start gap-3 md:w-1/2">
                <div className="h-14 w-14 bg-gray-100 rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {(product.image1 || product.images?.[0]) ? (
                    <img src={product.image1 || product.images[0]} alt={product.name} className="object-cover w-full h-full" />
                  ) : (
                    <ImageIcon className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    defaultValue={product.name}
                    readOnly={!isEditing(product.id, 'name')}
                    onDoubleClick={() => enableEditing(product.id, 'name')}
                    onBlur={(e) => {
                      const val = e.currentTarget.value
                      if (val !== product.name) {
                        updateProductField(product.id, 'name', val)
                      }
                      disableEditing(product.id, 'name')
                    }}
                    onKeyDown={commitOnEnter}
                    className="w-full text-sm font-semibold bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1 whitespace-pre-wrap break-words resize-none"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    <input
                      defaultValue={product.brand || ''}
                      placeholder="Marca"
                      readOnly={!isEditing(product.id, 'brand')}
                      onDoubleClick={() => enableEditing(product.id, 'brand')}
                      onBlur={(e) => {
                        const val = e.target.value
                        if (val !== (product.brand || '')) {
                          updateProductField(product.id, 'brand', val)
                        }
                        disableEditing(product.id, 'brand')
                      }}
                      onKeyDown={commitOnEnter}
                      className="w-full text-xs text-gray-600 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                    />
                    <input
                      defaultValue={product.model || ''}
                      placeholder="Modelo"
                      readOnly={!isEditing(product.id, 'model')}
                      onDoubleClick={() => enableEditing(product.id, 'model')}
                      onBlur={(e) => {
                        const val = e.target.value
                        if (val !== (product.model || '')) {
                          updateProductField(product.id, 'model', val)
                        }
                        disableEditing(product.id, 'model')
                      }}
                      onKeyDown={commitOnEnter}
                      className="w-full text-xs text-gray-600 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                  <div className="mt-2">
                    <select
                      defaultValue={product.category}
                      onChange={(e) => updateProductField(product.id, 'category', e.target.value)}
                      className="w-full text-sm bg-transparent border border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                    >
                      {categories.slice().sort((a:any,b:any)=>String(a.name||"").localeCompare(String(b.name||""))).map((cat:any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Precio</label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={product.price}
                    readOnly={!isEditing(product.id, 'price')}
                    onDoubleClick={() => enableEditing(product.id, 'price')}
                    onBlur={(e) => {
                      const val = Number(e.target.value || 0)
                      if (val !== product.price) {
                        updateProductField(product.id, 'price', val)
                      }
                      disableEditing(product.id, 'price')
                    }}
                    onKeyDown={commitOnEnter}
                    className="w-full text-sm bg-transparent border border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pts gana</label>
                  <input
                    type="number"
                    value={Number(product.points || 0)}
                    readOnly
                    className="w-full text-sm bg-transparent border border-gray-100 text-gray-600 rounded px-2 py-1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Pts canje</label>
                  <input
                    type="number"
                    defaultValue={Number(product.redeemPoints || ((product.points || 0) * 9))}
                    readOnly={!product.isReward}
                    onBlur={(e) => {
                      const next = Number(e.target.value || 0)
                      if (next !== (product.redeemPoints || ((product.points || 0) * 9))) updateProductField(product.id, 'redeemPoints', next)
                    }}
                    className={`w-full text-sm bg-transparent border ${product.isReward ? 'border-gray-200 focus:border-gray-300' : 'border-gray-100 text-gray-400'} rounded px-2 py-1`}
                  />
                </div>
                <div className="col-span-2 md:col-span-4 text-[11px] font-semibold text-gray-500 mt-1">Inventario</div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Stock</label>
                  <div className="flex items-center gap-2">
                    <input
                      key={`${product.id}-${getQty(product)}`}
                      type="number"
                      defaultValue={Number.isFinite(getQty(product)) ? getQty(product) : 0}
                      readOnly={!isEditing(product.id, 'quantity')}
                      onDoubleClick={() => enableEditing(product.id, 'quantity')}
                      onBlur={(e) => {
                        const val = Number(e.target.value || 0)
                        if (val !== getQty(product)) {
                          updateProductField(product.id, 'quantity', val)
                        }
                        disableEditing(product.id, 'quantity')
                      }}
                      onKeyDown={commitOnEnter}
                      className="w-16 md:w-20 text-center text-sm bg-transparent border border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Ubicación</label>
                  <input
                    defaultValue={String((product as any).location || (product as any).ubicacion || '')}
                    readOnly={!isEditing(product.id, 'location')}
                    onDoubleClick={() => enableEditing(product.id, 'location')}
                    onBlur={(e) => {
                      const val = e.target.value
                      const curr = String((product as any).location || (product as any).ubicacion || '')
                      if (val !== curr) {
                        updateProductField(product.id, 'location', val)
                      }
                      disableEditing(product.id, 'location')
                    }}
                    onKeyDown={commitOnEnter}
                    className="w-full text-sm bg-transparent border border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                  />
                </div>
                <div className="col-span-2 md:col-span-4 text-[11px] font-semibold text-gray-500 mt-1">Premio</div>
                <div className="col-span-2 md:col-span-1 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    defaultChecked={Boolean(product.isReward)}
                    onChange={(e) => updateProductField(product.id, 'isReward', e.target.checked)}
                  />
                  <span className="text-sm">Premio</span>
                </div>
                <div className="col-span-2 md:col-span-1 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    defaultChecked={(product as any).liquidation || false}
                    onChange={(e) => updateProductField(product.id, 'liquidation', e.target.checked)}
                  />
                  <span className="text-sm">Liquidación</span>
                </div>
                <div className="col-span-2 md:col-span-1 flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    defaultChecked={(product as any).weeklyOffer || false}
                    onChange={(e) => updateProductField(product.id, 'weeklyOffer', e.target.checked)}
                  />
                  <span className="text-sm">Oferta de la semana</span>
                </div>
                <div className="text-xs text-gray-500 self-center">{formatDate(product.updatedAt)}</div>
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/admin/products/edit/${product.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => { setProductToDelete(product); setDeleteDialogOpen(true) }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all" || stockFilter !== "all"
                ? "Intenta ajustar los filtros"
                : "Comienza agregando tu primer producto"}
            </p>
            <Link href="/admin/products/new">
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar "{productToDelete?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
