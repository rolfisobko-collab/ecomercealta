"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import HeroCarousel from "@/components/hero-carousel"
import { ChevronRight, ChevronLeft } from "lucide-react"
import useProducts from "@/hooks/useProducts"
import ProductCard from "@/components/product/ProductCard"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/models/Product"
import { useRouter } from "next/navigation"
import { categoryService } from "@/services/hybrid/categoryService"
import CategoryExplorer from "@/components/category-explorer"
import StoreBenefits from "@/components/store-benefits"
// Importar el nuevo componente PromoCTABanner
import PromoCTABanner from "@/components/promo-cta-banner"
// Importar el componente de últimos productos
import LatestProducts from "@/components/latest-products"
// Importar el nuevo componente BrandProducts al inicio del archivo:
import BrandProducts from "@/components/brand-products"
import { useCurrency } from "@/context/CurrencyContext"
import { fetchExchangeRate } from "@/utils/currencyUtils"
import { useCatalogCache } from "@/hooks/useCatalogCache"
import { fetchWithTimeout } from "@/utils/net"
import { useFeatured } from "@/hooks/useFeatured"

// Full weekly offers section, hidden when there are no items
function WeeklyOffersSection() {
  // Allow fallback to show instantly from local catalog cache while API loads
  const { weekly } = useFeatured(60, { fallbackWeekly: true })
  if (!Array.isArray(weekly) || weekly.length === 0) return null
  return (
    <section className="w-full pb-8 md:pb-12 bg-white dark:bg-gray-950">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Aprovechá nuestras <span className="text-red-600 dark:text-red-500">ofertas de la semana</span>
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Descuentos especiales por tiempo limitado en productos seleccionados
          </p>
        </div>

        {/* Carrusel de Ofertas */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Banner de Ofertas - Ahora con imagen */}
          <div className="md:w-1/4 min-w-[280px]">
            <div
              className="h-full rounded-xl shadow-md overflow-hidden"
              style={{
                backgroundImage:
                  'url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ofertas.jpg-bpJriSjlfWMbsux6HknHmmAeIUv2kf.jpeg")',
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              {/* La imagen ya contiene todo el texto necesario */}
            </div>
          </div>

          {/* Contenedor del carrusel - Ahora separado del banner */}
          <div className="relative md:w-3/4">
            {/* Botón izquierdo */}
            <button
              onClick={() => {
                const container = document.getElementById("offers-container")
                if (container) container.scrollBy({ left: -300, behavior: "smooth" })
              }}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Ver ofertas anteriores"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            {/* Contenedor del carrusel */}
            <div
              className="flex items-stretch gap-6 overflow-x-auto pb-4 snap-x snap-mandatory"
              id="offers-container"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <WeeklyOffersItems />
            </div>

            {/* Botón derecho */}
            <button
              onClick={() => {
                const container = document.getElementById("offers-container")
                if (container) container.scrollBy({ left: 300, behavior: "smooth" })
              }}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Ver más ofertas"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// Liquidation section wrapper that hides when there are no items
function LiquidationSection() {
  // Instant render via pre-rendered fragment; avoids client wait
  return (
    <section className="w-full py-8 md:py-12 bg-red-50 dark:bg-red-950/20">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="mb-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Productos en <span className="text-red-600 dark:text-red-500">Liquidación</span>
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Aprovechá los últimos a precio especial</p>
        </div>
        <LiquidationInstant />
      </div>
    </section>
  )
}


function LiquidationInstant() {
  const [html, setHtml] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/featured/liquidation-fragment?limit=12', { cache: 'no-store' })
        if (!res.ok) throw new Error('fragment error')
        const text = await res.text()
        if (!cancelled) setHtml(text)
      } catch {}
    })()
    return () => { cancelled = true }
  }, [])
  if (!html) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array(6).fill(0).map((_, i) => (
          <div key={i} className="h-40 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ))}
      </div>
    )
  }
  return <div dangerouslySetInnerHTML={{ __html: html }} />
}

// Weekly offers carousel items (top-level component)
function WeeklyOffersItems() {
  const { weekly } = useFeatured(60, { fallbackWeekly: false })
  const items = useMemo(() => {
    if (Array.isArray(weekly) && weekly.length > 0) return weekly.slice(0, 12)
    return []
  }, [weekly])

  if (!items || items.length === 0) return null
  return (
    <>
      {items.map((product: any) => (
        <div key={product.id} className="min-w-[200px] sm:min-w-[220px] snap-start">
          <ProductCard product={product} compact={true} priority={true} />
        </div>
      ))}
    </>
  )
}

function FilteredFeaturedProducts() {
  const { products, loading, error } = useProducts()
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const router = useRouter()

  // Use memoization to avoid unnecessary filtering on re-renders
  const getFilteredProducts = useCallback((productList: Product[]) => {
    console.log("Filtering products from total:", productList.length)

    if (!productList || productList.length === 0) return []

    // Implement a more efficient filtering process
    const base = productList
      .filter((product) => {
        // Check for valid price
        const hasPrice = product.price && product.price > 0

        // More efficient image check
        const anyP: any = product as any
        const hasImages =
          (product.images && Array.isArray(product.images) && product.images.length > 0) ||
          anyP.image1 ||
          anyP.image2 ||
          anyP.image3 ||
          anyP.image4 ||
          anyP.image5

        return hasPrice && hasImages
      })
    // Priorizar liquidación primero
    const sorted = base.slice().sort((a: any, b: any) => {
      const la = a?.liquidation ? 0 : 1
      const lb = b?.liquidation ? 0 : 1
      if (la !== lb) return la - lb
      return String(a?.name || "").localeCompare(String(b?.name || ""))
    })
    return sorted.slice(0, 12)
  }, [])

  // Memoize filtered products to prevent unnecessary calculations
  const memoizedFilteredProducts = useMemo(() => {
    if (products && products.length > 0) {
      return getFilteredProducts(products)
    }
    return []
  }, [products, getFilteredProducts])

  // Update state when memoized results change
  useEffect(() => {
    setFilteredProducts(memoizedFilteredProducts)

    if (memoizedFilteredProducts.length > 0) {
      // Prefetch first few product images
      memoizedFilteredProducts.slice(0, 4).forEach((product) => {
        const anyP: any = product as any
        if (anyP.image1) {
          const img = new Image()
        img.src = anyP.image1
        }
      })
    }
  }, [memoizedFilteredProducts])

  // Handle card click with manual navigation and scroll reset
  const handleCardClick = (e: React.MouseEvent, productId: string) => {
    e.preventDefault()
    // Forzar scroll al inicio antes de navegar
    window.scrollTo(0, 0)
    router.push(`/products/${productId}`)
  }

  if (loading) {
    return (
      <>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
      </>
    )
  }

  if (error) {
    return <p className="col-span-full text-center text-red-500">Error al cargar productos: {error.message}</p>
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="col-span-full text-center p-8">
        <p className="mb-2">No se encontraron productos con precios e imágenes.</p>
        <p className="text-sm text-gray-500">Total de productos cargados: {products?.length || 0}</p>
      </div>
    )
  }

  return (
    <>
      {filteredProducts.map((product) => (
        <div key={product.id} onClick={(e) => handleCardClick(e, product.id)} className="cursor-pointer">
          <ProductCard product={product} compact={true} priority={true} />
        </div>
      ))}
    </>
  )
}

// Componente para manejar los filtros y la paginación
function FeaturedProductsWithFilters() {
  const { products, loading, error } = useProducts()
  const [category, setCategory] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [dbCategories, setDbCategories] = useState<any[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const productsPerPage = 12

  // Cargar categorías desde la base de datos
  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true)
        const categoriesFromDb = await categoryService.getAll()
        console.log("Categorías cargadas de la BD:", categoriesFromDb)
        setDbCategories(categoriesFromDb)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    loadCategories()
  }, [])

  // Obtener categorías únicas de los productos y mapearlas con sus nombres
  const categories = useMemo(() => {
    if (!products || products.length === 0) return []

    // Obtener IDs únicos de categorías de los productos
    const uniqueCategoryIds = new Set(
      products.map((p: any) => (p.category ?? p.categoryId)).filter(Boolean)
    )

    // Mapear IDs a objetos con nombre desde la BD
    return Array.from(uniqueCategoryIds)
      .map((catId) => {
        // Buscar la categoría por ID en los datos de la BD
        const foundCategory = dbCategories.find((c) => c.id === catId)

        console.log(`Categoría ID: ${catId}, Encontrada:`, foundCategory)

        return {
          id: catId,
          name: foundCategory ? foundCategory.name : `Categoría ${catId}`,
        }
      })
      .sort((a, b) => a.name.localeCompare(b.name)) // Ordenar alfabéticamente
  }, [products, dbCategories])

  const filteredProducts = useMemo(() => {
    if (!products) return []
    let filtered = products.filter((product) => {
      const hasPrice = product.price && product.price > 0
      const anyP: any = product as any
      const hasImages =
        (product.images && Array.isArray(product.images) && product.images.length > 0) ||
        anyP.image1 ||
        anyP.image2 ||
        anyP.image3 ||
        anyP.image4 ||
        anyP.image5
      return hasPrice && hasImages
    })
    if (category) {
      filtered = filtered.filter((product) => {
        const anyP: any = product as any
        return (anyP.category === category) || (product as any).categoryId === category
      })
    }
    return filtered
  }, [products, category])

  const visibleProducts = useMemo(() => {
    // Agrupar por categoría detectando tanto category como categoryId
    const byCategory = new Map<string, Product[]>()
    for (const p of filteredProducts as any[]) {
      const cid = (p as any).category || (p as any).categoryId
      if (!cid) continue
      if (!byCategory.has(cid)) byCategory.set(cid, [])
      byCategory.get(cid)!.push(p as any)
    }

    // Ordenar cada grupo por createdAt desc
    for (const [cid, arr] of byCategory) {
      arr.sort((a: any, b: any) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
    }

    // Si hay categoría seleccionada: devolver los 12 últimos de ese grupo
    if (category) {
      const list = byCategory.get(category) || []
      return list.slice(0, 12)
    }

    // Sin categoría: tomar 1 último de cada categoría y quedarnos con 12 más recientes
    const onePerCategory: Product[] = []
    for (const [cid, arr] of byCategory) {
      if (arr.length > 0) onePerCategory.push(arr[0])
    }
    return onePerCategory
      .sort((a: any, b: any) => new Date(b.createdAt as any).getTime() - new Date(a.createdAt as any).getTime())
      .slice(0, 12)
  }, [filteredProducts, category])

  const paginatedProducts = useMemo(() => {
    // Priorizar liquidación primero
    const sorted = filteredProducts.slice().sort((a: any, b: any) => {
      const la = a?.liquidation ? 0 : 1
      const lb = b?.liquidation ? 0 : 1
      if (la !== lb) return la - lb
      return String(a?.name || "").localeCompare(String(b?.name || ""))
    })
    const startIndex = (page - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    return sorted.slice(startIndex, endIndex)
  }, [filteredProducts, page, productsPerPage])

  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / productsPerPage)
  }, [filteredProducts, productsPerPage])

  const handleCategoryChange = (newCategory: string | null) => {
    setCategory(newCategory)
    setPage(1) // Reset page to 1 when category changes
  }

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    // Eliminamos el scrollTo para evitar el desplazamiento al inicio
  }

  if (loading || loadingCategories) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-40 w-full rounded-lg" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          ))}
      </div>
    )
  }

  if (error) {
    return <p className="text-center text-red-500">Error al cargar productos: {error.message}</p>
  }

  // Calcular la altura aproximada de dos filas de productos
  const productGridHeight = "h-[700px]" // Altura aproximada de 2 filas de productos

  return (
    <div>
      {/* Category Filters con botones de navegación */}
      <div className="relative">
        <button
          onClick={() => {
            const container = document.getElementById("category-scroll-container")
            if (container) {
              container.scrollBy({ left: -200, behavior: "smooth" })
            }
          }}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Desplazar categorías a la izquierda"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          id="category-scroll-container"
          className="flex overflow-x-auto mb-6 py-2 px-8 space-x-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <Button
            variant="outline"
            className={`mr-2 rounded-full px-4 py-2 whitespace-nowrap ${
              category === null ? "bg-red-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            onClick={() => handleCategoryChange(null)}
          >
            Todos
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat.id}
              variant="outline"
              className={`mr-2 rounded-full px-4 py-2 whitespace-nowrap ${
                category === cat.id ? "bg-red-500 text-white" : "hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <button
          onClick={() => {
            const container = document.getElementById("category-scroll-container")
            if (container) {
              container.scrollBy({ left: 200, behavior: "smooth" })
            }
          }}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Desplazar categorías a la derecha"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div>
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} compact={true} priority={true} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="text-center max-w-md px-4">
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">¡Estamos ampliando nuestro catálogo!</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">Actualmente estamos registrando más productos en esta categoría. Es posible que tengamos disponibilidad en nuestro stock físico aunque no aparezca en la web.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild className="bg-green-500 hover:bg-green-600 text-white font-medium px-6 py-2 rounded-full flex items-center justify-center gap-2">
                  <a href={`https://wa.me/5493764903766?text=Hola,%20me%20gustaría%20consultar%20por%20disponibilidad%20de%20productos%20en%20la%20categoría:%20${category ? categories.find((cat) => cat.id === category)?.name || "Categoría específica" : "Todas las categorías"}`} target="_blank" rel="noopener noreferrer">Consultar disponibilidad</a>
                </Button>
                <Button variant="outline" asChild className="border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent">
                  <Link href="/search">Ver otros productos</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pagination - Estilizado */}
      {false && (
        <div className="flex justify-center items-center mt-8 gap-2">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => handlePageChange(page - 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Anterior</span>
          </Button>

          <div className="flex items-center px-4">
            <span className="text-sm font-medium">
              Página <span className="text-red-600 dark:text-red-400 font-bold">{page}</span> de{" "}
              <span className="font-bold">{totalPages}</span>
            </span>
          </div>

          <Button
            variant="outline"
            disabled={page === totalPages}
            onClick={() => handlePageChange(page + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <span>Siguiente</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      {/* CTA para Servicio Técnico */}
      <div className="mt-8 mb-6 rounded-xl overflow-hidden shadow-lg relative">
        <div
          className="relative h-48 bg-cover bg-center"
          style={{
            backgroundImage:
              'url("https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reparacion.jpg-Tn8ewOiz7BxqjoRTk3ab2GSdKOkXKq.jpeg")',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/80"></div>
          <div className="absolute inset-0 flex items-center justify-end">
            <div className="w-full md:w-1/2 p-6 text-right">
              <h3 className="text-xl md:text-2xl font-bold text-white mb-2">¿Necesitás reparar tu dispositivo?</h3>
              <p className="text-gray-100 text-sm mb-4 max-w-md ml-auto">
                Contamos con técnicos especializados y repuestos originales para solucionar cualquier problema.
              </p>
              <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                <Link href="/servicio-tecnico">Cotizar servicio</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/gremio')
  }, [router])
  return null
}
