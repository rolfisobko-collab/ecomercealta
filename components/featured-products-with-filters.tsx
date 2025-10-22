"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { categories } from "@/data/categories"
import useProducts from "@/hooks/useProducts"
import ProductCard from "@/components/product/ProductCard"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/models/Product"

export default function FeaturedProductsWithFilters() {
  const { products, loading } = useProducts()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const productsPerPage = 6

  // Filtrar productos por categoría y configurar paginación
  useEffect(() => {
    if (!products || products.length === 0) return

    let filtered = products

    // Filtrar por categoría si hay una seleccionada
    if (selectedCategory) {
      filtered = products.filter((product) => product.category === selectedCategory)
    }

    // Filtrar solo productos con precio e imágenes
    filtered = filtered.filter((product) => {
      const hasPrice = product.price && product.price > 0
      const hasImages = product.image1 || (product.images && product.images.length > 0)
      return hasPrice && hasImages
    })

    setFilteredProducts(filtered)
    setTotalPages(Math.ceil(filtered.length / productsPerPage))
    setCurrentPage(0) // Resetear a la primera página cuando cambia el filtro
  }, [products, selectedCategory])

  // Obtener productos para la página actual
  const getCurrentPageProducts = () => {
    const startIndex = currentPage * productsPerPage
    return filteredProducts.slice(startIndex, startIndex + productsPerPage)
  }

  // Manejar navegación de categorías
  const scrollCategories = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200
      const newScrollLeft =
        direction === "left"
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      })
    }
  }

  // Manejar navegación de páginas
  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage < totalPages) {
      setCurrentPage(newPage)
      // Scroll al inicio de la sección de productos
      window.scrollTo({ top: window.scrollY - 100, behavior: "smooth" })
    }
  }

  return (
    <div className="space-y-6">
      {/* Filtros de categoría con scroll horizontal */}
      <div className="relative">
        <button
          onClick={() => scrollCategories("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Desplazar categorías a la izquierda"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-2 px-8 space-x-2 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
              selectedCategory === null
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "hover:bg-red-50 hover:text-red-600"
            }`}
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Button>

          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm ${
                selectedCategory === category.id
                  ? "bg-red-600 hover:bg-red-700 text-white"
                  : "hover:bg-red-50 hover:text-red-600"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>

        <button
          onClick={() => scrollCategories("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:bg-gray-100 dark:hover:bg-gray-700"
          aria-label="Desplazar categorías a la derecha"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Grid de productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          // Esqueletos de carga
          Array(6)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="border rounded-lg p-4 h-[400px]">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-6 w-1/3" />
              </div>
            ))
        ) : filteredProducts.length === 0 ? (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-gray-500">No se encontraron productos en esta categoría.</p>
          </div>
        ) : (
          // Productos de la página actual
          getCurrentPageProducts().map((product) => (
            <div
              key={product.id}
              className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <ProductCard product={product} priority={true} />
            </div>
          ))
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-8 space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            className="h-8 w-8"
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <Button
                key={index}
                variant={currentPage === index ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(index)}
                className={`h-8 w-8 p-0 ${currentPage === index ? "bg-red-600 hover:bg-red-700 text-white" : ""}`}
              >
                {index + 1}
              </Button>
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="h-8 w-8"
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
