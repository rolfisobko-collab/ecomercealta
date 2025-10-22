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

function LiquidationSection() {
  const { products, loading, error } = useProducts()
  const items = useMemo(() => {
    if (!products) return []
    return (products as any[]).filter((p: any) => !!p?.liquidation)
  }, [products])

  if (loading) {
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

  if (items.length === 0) {
    return <p className="text-sm text-gray-500">No hay productos en liquidación en este momento.</p>
  }

  const top = items
    .slice()
    .sort((a: any, b: any) => String(a?.name || "").localeCompare(String(b?.name || "")))
    .slice(0, 12)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {top.map((product: any) => (
        <ProductCard key={product.id} product={product as any} compact={true} priority={true} />
      ))}
    </div>
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
  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { currency: selectedCurrency } = useCurrency()
  const [exchangeRate, setExchangeRate] = useState(1100) // Valor inicial

  // Cargar la tasa de cambio desde Firebase
  useEffect(() => {
    let isMounted = true

    async function loadExchangeRate() {
      try {
        const rate = await fetchExchangeRate("USD_ARS")
        if (isMounted) {
          setExchangeRate(rate)
          console.log("Tasa de cambio cargada:", rate)
        }
      } catch (error) {
        console.error("Error al cargar tasa de cambio:", error)
      }
    }

    loadExchangeRate()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Carousel */}
      <HeroCarousel />

      {/* Sección Liquidación */}
      <section className="w-full py-8 md:py-12 bg-red-50 dark:bg-red-950/20">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="mb-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Productos en <span className="text-red-600 dark:text-red-500">Liquidación</span>
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">Aprovechá los últimos a precio especial</p>
          </div>
          <LiquidationSection />
        </div>
      </section>

      

      {/* Sección de Ofertas Semanales */}
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
                {/* Productos en oferta (hardcodeados para asegurar que se vean) */}
                <div className="min-w-[220px] sm:min-w-[250px] rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 snap-start">
                  <div className="relative">
                    {/* Actualizada con la nueva imagen proporcionada */}
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-N76BO3dKvJkninQuxNkCUTXLbUWR3c.png"
                      alt="Estación de soldar Yaxun 886D"
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -30%
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2">Estación de soldar Yaxun 886D</h3>
                    <div className="mt-2">
                      <span className="text-gray-500 line-through text-sm">
                        {selectedCurrency === "ARS" ? `$${(107 * exchangeRate).toLocaleString("es-AR")}` : "$107"}
                      </span>
                      <p className="text-red-600 font-bold text-lg">
                        {selectedCurrency === "ARS" ? `$${(75 * exchangeRate).toLocaleString("es-AR")}` : "$75"}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-3 text-sm bg-transparent">
                      <Link href="/products/d15e39b3-b78b-44f2-8635-40a81d468bd2">Ver producto</Link>
                    </Button>
                  </div>
                </div>

                <div className="min-w-[220px] sm:min-w-[250px] rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 snap-start">
                  <div className="relative">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1738265047542fb6b3b26a6a7b5312198b2fa2aa7c.jpg-nHIXLYDVRJfWSjB3f3cn1PcmVxUDKZ.jpeg"
                      alt="Trinocula Relife M6T Pro B11"
                      className="w-full h-48 object-contain bg-white p-2"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -30%
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2">Trinocula Relife M6T Pro B11</h3>
                    <div className="mt-2">
                      <span className="text-gray-500 line-through text-sm">
                        {selectedCurrency === "ARS" ? `$${(600 * exchangeRate).toLocaleString("es-AR")}` : "$600"}
                      </span>
                      <p className="text-red-600 font-bold text-lg">
                        {selectedCurrency === "ARS" ? `$${(420 * exchangeRate).toLocaleString("es-AR")}` : "$420"}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-3 text-sm bg-transparent">
                      <Link href="https://www.altatelefonia.com.ar/products/jXqgMni65a9IupB01vas">Ver producto</Link>
                    </Button>
                  </div>
                </div>

                <div className="min-w-[220px] sm:min-w-[250px] rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 snap-start">
                  <div className="relative">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/6490-soporte-para-microscopio-brazo-oscilante-relife-rl-m28-b50f245684d672592b17372145961100-480-0.jpg-JmV6cEt8iRVMAxXJyTPiHauv8UBWOt.jpeg"
                      alt="Brazo Soporte Relife RL-M28"
                      className="w-full h-48 object-contain bg-white p-2"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -20%
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2">Brazo Soporte Relife RL-M28</h3>
                    <div className="mt-2">
                      <span className="text-gray-500 line-through text-sm">
                        {selectedCurrency === "ARS" ? `$${(138 * exchangeRate).toLocaleString("es-AR")}` : "$138"}
                      </span>
                      <p className="text-red-600 font-bold text-lg">
                        {selectedCurrency === "ARS" ? `$${(110 * exchangeRate).toLocaleString("es-AR")}` : "$110"}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-3 text-sm bg-transparent">
                      <Link href="https://www.altatelefonia.com.ar/products/144830c9-92c7-438f-88ba-849992beaa96">
                        Ver producto
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="min-w-[220px] sm:min-w-[250px] rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 snap-start">
                  <div className="relative">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-xNs3BLydsKqn3COuGNzk4ykpe55HQA.png"
                      alt="Precalentadora L2023"
                      className="w-full h-48 object-contain bg-white p-2"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -40%
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2">Precalentadora L2023</h3>
                    <div className="mt-2">
                      <span className="text-gray-500 line-through text-sm">
                        {selectedCurrency === "ARS" ? `$${(267 * exchangeRate).toLocaleString("es-AR")}` : "$267"}
                      </span>
                      <p className="text-red-600 font-bold text-lg">
                        {selectedCurrency === "ARS" ? `$${(160 * exchangeRate).toLocaleString("es-AR")}` : "$160"}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-3 text-sm bg-transparent">
                      <Link href="https://www.altatelefonia.com.ar/products/ce037ff2-d656-49b4-83b1-bf955e054359">
                        Ver producto
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="min-w-[220px] sm:min-w-[250px] rounded-xl overflow-hidden shadow-md bg-white dark:bg-gray-800 snap-start">
                  <div className="relative">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/D_NQ_NP_863283-MLA81240843224_122024-O-YhAzyab8amIfXMPnGfp356XzX2FyDJ.webp"
                      alt="Extractor de humo Aiolos Fan 2UUL"
                      className="w-full h-48 object-contain bg-white p-2"
                    />
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                      -35%
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-sm line-clamp-2">Extractor de humo Aiolos Fan 2UUL</h3>
                    <div className="mt-2">
                      <span className="text-gray-500 line-through text-sm">
                        {selectedCurrency === "ARS" ? `$${(62 * exchangeRate).toLocaleString("es-AR")}` : "$62"}
                      </span>
                      <p className="text-red-600 font-bold text-lg">
                        {selectedCurrency === "ARS" ? `$${(40 * exchangeRate).toLocaleString("es-AR")}` : "$40"}
                      </p>
                    </div>
                    <Button asChild variant="outline" className="w-full mt-3 text-sm bg-transparent">
                      <Link href="https://www.altatelefonia.com.ar/products/69fe0b4d-596b-48af-aaaa-d53b3faaf35a">
                        Ver producto
                      </Link>
                    </Button>
                  </div>
                </div>
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

      {/* Explorador de Categorías */}
      <section className="w-full py-8 md:py-12 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <CategoryExplorer />
        </div>
      </section>

      {/* Beneficios de la tienda */}
      <section className="w-full">
        <StoreBenefits />
      </section>

      {/* Banner CTA Promocional */}
      <PromoCTABanner
        title="Nuevo iPhone 16 Pro Max"
        description="Descubrí el poder del nuevo chip A18 Pro y la cámara más avanzada en un iPhone. Disponible ahora con entrega inmediata."
        buttonText="Ver detalles"
        buttonLink="/products/iphone-16-pro-max"
        termsText="Ver bases y condiciones"
        termsLink="/terminos"
      />

      {/* Componente de últimos productos */}
      <LatestProducts />

      {/* Componente de productos por marca */}
      <BrandProducts />

      {/* Botones flotantes de contacto */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {/* Botón de WhatsApp */}
        <a
          href="https://wa.me/5493764903766"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
          aria-label="Contactar por WhatsApp"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="group-hover:scale-110 transition-transform duration-200"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>

        {/* Botón de Telegram */}
        <a
          href="https://t.me/altaTelDevBot"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-14 h-14 bg-[#0088cc] text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
          aria-label="Contactar por Telegram"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="group-hover:scale-110 transition-transform duration-200"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </a>
      </div>
    </div>
  )
}
