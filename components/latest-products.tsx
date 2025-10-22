"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { productService } from "@/services/hybrid/productService"
import type { Product } from "@/models/Product"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/utils/currencyUtils"
import { fetchExchangeRate } from "@/utils/currencyUtils"
import { cn } from "@/lib/utils"
import { useCurrency } from "@/context/CurrencyContext"

export default function LatestProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [animatingPage, setAnimatingPage] = useState<boolean>(false)
  const [direction, setDirection] = useState<"left" | "right" | null>(null)
  const productsPerPage = 3
  const totalPages = Math.ceil(products.length / productsPerPage)
  const { currency } = useCurrency()
  const [exchangeRate, setExchangeRate] = useState(1100) // Valor inicial

  useEffect(() => {
    async function loadLatestProducts() {
      try {
        setLoading(true)
        // Obtener todos los productos
        const allProducts = await productService.getAll()

        // Ordenar por fecha de creación (más recientes primero)
        const sortedProducts = allProducts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime()
          const dateB = new Date(b.createdAt || 0).getTime()
          return dateB - dateA
        })

        // Filtrar productos con imágenes y precio
        const filteredProducts = sortedProducts.filter((product) => {
          const hasPrice = product.price && product.price > 0
          const hasImages =
            (product.images && Array.isArray(product.images) && product.images.length > 0) ||
            product.image1 ||
            product.image2 ||
            product.image3 ||
            product.image4 ||
            product.image5

          return hasPrice && hasImages
        })

        // Tomar los primeros 12 productos como máximo
        setProducts(filteredProducts.slice(0, 12))
      } catch (error) {
        console.error("Error al cargar los últimos productos:", error)
      } finally {
        setLoading(false)
      }
    }

    loadLatestProducts()
  }, [])

  // Cargar la tasa de cambio desde Firebase
  useEffect(() => {
    let isMounted = true

    async function loadExchangeRate() {
      try {
        const rate = await fetchExchangeRate("USD_ARS")
        if (isMounted) {
          setExchangeRate(rate)
          console.log("Tasa de cambio cargada en latest-products:", rate)
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

  const handlePrevPage = () => {
    if (animatingPage) return
    setDirection("left")
    setAnimatingPage(true)
    setTimeout(() => {
      setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1))
      setAnimatingPage(false)
    }, 300)
  }

  const handleNextPage = () => {
    if (animatingPage) return
    setDirection("right")
    setAnimatingPage(true)
    setTimeout(() => {
      setCurrentPage((prev) => (prev < totalPages - 1 ? prev + 1 : 0))
      setAnimatingPage(false)
    }, 300)
  }

  const handleDotClick = (index: number) => {
    if (animatingPage) return
    setDirection(index > currentPage ? "right" : "left")
    setAnimatingPage(true)
    setTimeout(() => {
      setCurrentPage(index)
      setAnimatingPage(false)
    }, 300)
  }

  // Obtener los productos para la página actual
  const currentProducts = products.slice(currentPage * productsPerPage, (currentPage + 1) * productsPerPage)

  // Simular calificaciones aleatorias para los productos
  const getRandomRating = (productId: string) => {
    // Usar el ID del producto para generar una calificación consistente
    const hash = productId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return {
      rating: ((hash % 25) + 35) / 10, // Generar un número entre 3.5 y 5
      reviewCount: (hash % 45) + 5, // Generar un número entre 5 y 49
    }
  }

  if (loading) {
    return (
      <div className="w-full py-8 pb-2 bg-white dark:bg-gray-950">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl min-h-[500px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Conocé nuestras <span className="text-red-600 dark:text-red-500">últimas novedades</span>
            </h2>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" className="rounded-full" disabled>
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Anterior</span>
              </Button>
              <Button variant="outline" size="icon" className="rounded-full" disabled>
                <ChevronRight className="h-4 w-4" />
                <span className="sr-only">Siguiente</span>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[380px]">
            {Array(3)
              .fill(0)
              .map((_, i) => (
                <div key={i} className="relative">
                  <Card className="overflow-hidden h-[350px] border border-gray-200 bg-white shadow-sm">
                    <CardContent className="p-0">
                      <div className="p-6 h-full flex flex-col">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-6 w-48 mb-4" />
                        <div className="flex-1 flex items-center justify-center py-4">
                          <Skeleton className="h-32 w-32" />
                        </div>
                        <div className="h-16 flex items-center justify-center">
                          <Skeleton className="h-8 w-32" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
          </div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="w-full py-8 pb-2 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl min-h-[500px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Conocé nuestras{" "}
            <span className="bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              últimas novedades
            </span>
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-gray-200 hover:bg-red-50 dark:border-gray-800 dark:hover:bg-red-900/20 transition-all duration-300 hover:border-red-300"
              onClick={handlePrevPage}
              aria-label="Productos anteriores"
              disabled={animatingPage}
            >
              <ChevronLeft className="h-4 w-4 text-red-500" />
              <span className="sr-only">Anterior</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-gray-200 hover:bg-red-50 dark:border-gray-800 dark:hover:bg-red-900/20 transition-all duration-300 hover:border-red-300"
              onClick={handleNextPage}
              aria-label="Productos siguientes"
              disabled={animatingPage}
            >
              <ChevronRight className="h-4 w-4 text-red-500" />
              <span className="sr-only">Siguiente</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-[380px] relative overflow-hidden p-2 md:p-4 mx-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 rounded-xl">
          <div
            className={cn(
              "w-full grid grid-cols-1 md:grid-cols-3 gap-6 absolute transition-transform duration-300 ease-out p-2 md:p-3",
              animatingPage
                ? direction === "right"
                  ? "translate-x-[-100%] opacity-0"
                  : "translate-x-[100%] opacity-0"
                : "translate-x-0 opacity-100",
            )}
            style={{
              gridTemplateColumns: "repeat(3, 1fr)",
              width: "calc(100% - 2rem)", // Reducir el ancho para dejar espacio igual en ambos lados
              margin: "0 auto", // Centrar el contenido
            }}
          >
            {currentProducts.map((product) => (
              <Link href={`/products/${product.id}`} key={product.id} className="group relative">
                <Card className="overflow-hidden h-[350px] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-red-200 hover:-translate-y-1">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/0 via-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <CardContent className="p-0 h-full bg-white">
                    <div className="p-6 h-full flex flex-col relative text-gray-900">
                      {/* Badge de novedad con efecto de brillo */}
                      <div className="absolute -right-1 -top-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold py-1 px-3 rounded-bl-lg rounded-tr-lg shadow-md transform rotate-2 z-10 overflow-hidden">
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"
                          style={{ backgroundSize: "200% 100%" }}
                        ></div>
                        NUEVO
                      </div>

                      {/* Título del producto */}
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                        {product.name}
                      </h3>

                      {/* Calificación con estrellas */}
                      <div className="flex items-center mb-3">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => {
                            const { rating, reviewCount } = getRandomRating(product.id)
                            return (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < Math.floor(rating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : i < rating
                                      ? "fill-yellow-400 text-yellow-400 opacity-50"
                                      : "fill-gray-200 text-gray-200"
                                }
                              />
                            )
                          })}
                        <span className="text-xs text-gray-500 ml-1">({getRandomRating(product.id).reviewCount})</span>
                      </div>

                      {/* Imagen del producto con efecto de hover */}
                      <div className="flex-1 flex items-center justify-center py-0 overflow-hidden">
                        <div className="relative w-full h-full flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50 opacity-0 group-hover:opacity-10 transition-opacity"></div>
                          <img
                            src={product.image1 || product.images?.[0] || "/placeholder.svg?height=150&width=150"}
                            alt={product.name}
                            className="h-32 object-contain transform transition-transform duration-500 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>
                      </div>

                      {/* Precio fijo en la parte inferior */}
                      <div className="h-16 flex items-center justify-center relative">
                        <div className="absolute bottom-0 left-0 right-0 h-16 flex items-center justify-center group-hover:-translate-y-1 transition-transform">
                          <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform">
                            {currency === "ARS"
                              ? `$${new Intl.NumberFormat("es-AR").format(product.price * exchangeRate)}`
                              : formatCurrency(product.price)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Indicadores de página mejorados */}
        <div className="flex justify-center mt-4 gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={`transition-all duration-300 ease-out relative overflow-hidden ${
                i === currentPage
                  ? "w-8 h-3 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                  : "w-3 h-3 bg-gray-300 dark:bg-gray-700 rounded-full hover:bg-red-300 dark:hover:bg-red-700"
              }`}
              onClick={() => handleDotClick(i)}
              aria-label={`Ir a página ${i + 1}`}
              disabled={animatingPage}
            >
              {i === currentPage && (
                <span
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
                  style={{ backgroundSize: "200% 100%" }}
                ></span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Añadir esta animación al CSS global
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .animate-shimmer {
      animation: shimmer 2s infinite linear;
    }
  `
  document.head.appendChild(style)
}
