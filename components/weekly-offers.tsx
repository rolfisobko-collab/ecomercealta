"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/utils/currencyUtils"
import useProducts from "@/hooks/useProducts"
import type { Product } from "@/models/Product"

export default function WeeklyOffers() {
  const { products, loading } = useProducts()
  const [currentIndex, setCurrentIndex] = useState(0)

  // Filtrar productos que tienen descuento (precio anterior > precio actual)
  const discountedProducts = useMemo(() => {
    if (!products) return []

    return products
      .filter((product) => {
        return (
          product.oldPrice &&
          product.price &&
          product.oldPrice > product.price &&
          (product.image1 || (product.images && product.images.length > 0))
        )
      })
      .slice(0, 12) // Limitar a 12 productos
  }, [products])

  // Calcular el porcentaje de descuento
  const calculateDiscount = (oldPrice: number, currentPrice: number) => {
    const discount = ((oldPrice - currentPrice) / oldPrice) * 100
    return Math.round(discount)
  }

  // Función para navegar en el carrusel
  const navigate = (direction: "prev" | "next") => {
    if (direction === "prev") {
      setCurrentIndex((prev) => (prev > 0 ? prev - 1 : 0))
    } else {
      const maxIndex = Math.max(0, discountedProducts.length - getVisibleItems())
      setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : maxIndex))
    }
  }

  // Determinar cuántos elementos mostrar según el ancho de la pantalla
  const getVisibleItems = () => {
    if (typeof window !== "undefined") {
      if (window.innerWidth >= 1280) return 4 // xl
      if (window.innerWidth >= 1024) return 3 // lg
      if (window.innerWidth >= 768) return 2 // md
      return 1 // sm y xs
    }
    return 4 // Default para SSR
  }

  // Ajustar el índice si cambia el número de productos
  useEffect(() => {
    const maxIndex = Math.max(0, discountedProducts.length - getVisibleItems())
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex)
    }
  }, [discountedProducts.length, currentIndex])

  // Manejar cambios de tamaño de ventana
  useEffect(() => {
    const handleResize = () => {
      const maxIndex = Math.max(0, discountedProducts.length - getVisibleItems())
      if (currentIndex > maxIndex) {
        setCurrentIndex(maxIndex)
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [currentIndex, discountedProducts.length])

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-red-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando ofertas...</p>
      </div>
    )
  }

  if (discountedProducts.length === 0) {
    return null // No mostrar la sección si no hay productos con descuento
  }

  return (
    <div className="py-8">
      {/* Encabezado de la sección */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
          Aprovechá nuestras <span className="text-red-600 dark:text-red-500">ofertas de la semana</span>
        </h2>
        <div className="hidden md:flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("prev")}
            disabled={currentIndex === 0}
            className="rounded-full border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("next")}
            disabled={currentIndex >= discountedProducts.length - getVisibleItems()}
            className="rounded-full border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Banner promocional */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-1 rounded-xl overflow-hidden">
          <div className="h-full bg-gradient-to-br from-red-600 via-red-500 to-amber-500 p-6 flex flex-col justify-center items-center text-white">
            <h3 className="text-2xl font-bold mb-2 text-center">OFERTAS SEMANALES</h3>
            <div className="text-3xl font-extrabold mb-4 text-center">¡HASTA 40% OFF!</div>
            <p className="text-sm text-center opacity-90">Aprovechá estos descuentos por tiempo limitado</p>
          </div>
        </div>

        {/* Carrusel de productos */}
        <div className="lg:col-span-4 relative">
          <div className="flex overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentIndex * (100 / getVisibleItems())}%)` }}
            >
              {discountedProducts.map((product: Product) => {
                const discount =
                  product.oldPrice && product.price ? calculateDiscount(product.oldPrice, product.price) : 0

                return (
                  <div key={product.id} className="w-full sm:w-1/2 md:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 h-full flex flex-col">
                      {/* Imagen y badge de descuento */}
                      <div className="relative pt-[100%]">
                        <div className="absolute inset-0 p-4">
                          <div className="relative h-full w-full">
                            <Image
                              src={
                                product.image1 ||
                                (product.images && product.images[0]) ||
                                "/placeholder.svg?height=200&width=200&query=producto"
                              }
                              alt={product.name || "Producto en oferta"}
                              fill
                              className="object-contain"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                          </div>
                        </div>
                        <Badge className="absolute top-2 left-2 bg-red-600 hover:bg-red-700 text-white font-bold">
                          -{discount}%
                        </Badge>
                      </div>

                      {/* Información del producto */}
                      <div className="p-4 flex flex-col flex-grow">
                        <h3 className="font-medium text-sm mb-2 line-clamp-2 h-10">{product.name}</h3>
                        <div className="mt-auto">
                          <div className="flex flex-col">
                            <span className="text-gray-500 dark:text-gray-400 line-through text-sm">
                              {formatCurrency(product.oldPrice || 0)}
                            </span>
                            <span className="text-red-600 dark:text-red-500 font-bold text-lg">
                              {formatCurrency(product.price || 0)}
                            </span>
                          </div>
                          <Button
                            asChild
                            variant="outline"
                            className="w-full mt-3 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                          >
                            <Link href={`/products/${product.id}`}>Ver producto</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Controles de navegación móviles */}
          <div className="flex justify-center gap-2 mt-4 md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("prev")}
              disabled={currentIndex === 0}
              className="rounded-full border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate("next")}
              disabled={currentIndex >= discountedProducts.length - getVisibleItems()}
              className="rounded-full border-2 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
