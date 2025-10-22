"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { categoryService } from "@/services/hybrid/categoryService"
import Link from "next/link"
import { useMediaQuery } from "@/hooks/use-mobile"

// Mapeo de categorías a imágenes como fallback
const categoryImageMap: Record<string, string> = {
  // Categorías de reparación de teléfonos
  herramientas: "/phone-repair-tools.png",
  insumos: "/phone-repair-tools.png",
  "herramientas e insumos": "/phone-repair-tools.png",
  repuestos: "/category-images/phone-parts.png",
  pantallas: "/category-images/phone-screens.png",
  baterías: "/category-images/phone-batteries.png",
  cámaras: "/category-images/phone-cameras.png",
  camaras: "/category-images/phone-cameras.png",
  smartphones: "/category-images/modern-smartphones.png",
  celulares: "/category-images/modern-smartphones.png",
  teléfonos: "/category-images/modern-smartphones.png",
  telefonos: "/category-images/modern-smartphones.png",
  "botones home": "/category-images/home-buttons.png",
  "botón home": "/category-images/home-buttons.png",
  "boton home": "/category-images/home-buttons.png",
  "home button": "/category-images/home-buttons.png",
  "HOME BOTON": "/category-images/home-buttons.png",
  tablets: "/category-images/tablets.png",
  tablet: "/category-images/tablets.png",

  // Categorías de computación
  procesadores: "/category-images/processors.png",
  periféricos: "/category-images/peripherals.png",
  monitores: "/category-images/monitors.png",
  "placas de video": "/category-images/video-cards.png",
  mothers: "/category-images/motherboards.png",
  motherboards: "/category-images/motherboards.png",
  fuentes: "/category-images/power-supplies.jpg",
  memorias: "/category-images/ram-memory.jpg",
  ram: "/category-images/ram-memory.jpg",
  almacenamiento: "/category-images/storage.jpg",
  discos: "/category-images/storage.jpg",

  // Categorías de accesorios
  fundas: "/category-images/phone-cases.png",
  protectores: "/category-images/screen-protectors.png",
  cargadores: "/category-images/chargers.jpg",
  cables: "/category-images/cables.jpg",
  auriculares: "/category-images/headphones.jpg",
  audio: "/category-images/audio.jpg",
}

// Imagen por defecto
const defaultCategoryImage = "/category-images/default-category.jpg"

export default function CategoryExplorer() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [categoryImages, setCategoryImages] = useState<Record<string, string>>({})
  const isLargeScreen = useMediaQuery("(min-width: 1024px)")
  const isMediumScreen = useMediaQuery("(min-width: 768px)")
  const isSmallScreen = useMediaQuery("(min-width: 640px)")

  // Determina cuántas categorías pequeñas mostrar según el tamaño de la pantalla
  const getSmallCategoriesCount = () => {
    if (isLargeScreen) return 8 // Pantalla grande: 8 categorías (4x2)
    if (isMediumScreen) return 6 // Pantalla mediana: 6 categorías (3x2)
    if (isSmallScreen) return 4 // Pantalla pequeña: 4 categorías (2x2)
    return 2 // Pantalla muy pequeña: 2 categorías (2x1)
  }

  // Determina el número de columnas según el tamaño de la pantalla
  const getGridCols = () => {
    if (isLargeScreen) return 4 // 4 columnas en pantallas grandes
    if (isMediumScreen) return 3 // 3 columnas en pantallas medianas
    if (isSmallScreen) return 2 // 2 columnas en pantallas pequeñas
    return 2 // 2 columnas en pantallas muy pequeñas
  }

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true)
        const categoriesFromDb = await categoryService.getAll()
        setCategories(categoriesFromDb)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      } finally {
        setLoading(false)
      }
    }

    loadCategories()
  }, [])

  // Cargar configuración de imágenes de categorías
  useEffect(() => {
    const loadCategoryImages = async () => {
      try {
        const res = await fetch("/api/flyers", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setCategoryImages(data.categoryImages || {})
        }
      } catch (error) {
        console.error("Error loading category images:", error)
      }
    }
    loadCategoryImages()
  }, [])

  useEffect(() => {
    // Resetear la página actual cuando cambie el tamaño de la pantalla
    setCurrentPage(0)
  }, [isLargeScreen, isMediumScreen, isSmallScreen])

  const scrollLeft = () => {
    if (currentPage > 0 && !isAnimating) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentPage(currentPage - 1)
        setTimeout(() => setIsAnimating(false), 300)
      }, 150)
    }
  }

  const scrollRight = () => {
    const smallCategoriesCount = getSmallCategoriesCount()
    const maxPage = Math.ceil((categories.length - 1) / smallCategoriesCount) - 1

    if (currentPage < maxPage && !isAnimating) {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentPage(currentPage + 1)
        setTimeout(() => setIsAnimating(false), 300)
      }, 150)
    }
  }

  // Función para encontrar la categoría "Herramientas e Insumos" o equivalente
  const findFeaturedCategoryIndex = () => {
    const targetNames = ["herramientas e insumos", "herramientas", "insumos", "tools", "supplies"]
    const index = categories.findIndex((cat) =>
      targetNames.some((name) => cat.name.toLowerCase().includes(name.toLowerCase())),
    )
    return index !== -1 ? index : 0 // Si no se encuentra, usamos la primera
  }

  // Reorganizar categorías para que la destacada aparezca primero
  const reorderCategories = () => {
    if (categories.length === 0) return []

    const featuredIndex = findFeaturedCategoryIndex()
    if (featuredIndex === 0) return categories

    const result = [...categories]
    const featured = result.splice(featuredIndex, 1)[0]
    result.unshift(featured)

    return result
  }

  const orderedCategories = reorderCategories()

  // Obtener las categorías para la página actual
  const getPageCategories = () => {
    const smallCategoriesCount = getSmallCategoriesCount()
    const startIdx = currentPage * smallCategoriesCount + 1 // +1 porque la primera categoría siempre es la destacada
    return orderedCategories.slice(startIdx, startIdx + smallCategoriesCount)
  }

  // Función para obtener la imagen de una categoría
  const getCategoryImage = (category: any) => {
    if (!category || !category.name) return defaultCategoryImage

    const categoryName = category.name.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    // Primero buscar en configuración dinámica
    const dynamicImage = categoryImages[categoryName]
    if (dynamicImage) return dynamicImage

    // Luego buscar en mapeo estático
    const staticImage = categoryImageMap[category.name.toLowerCase()]
    if (staticImage) return staticImage

    // Buscar coincidencias parciales en mapeo estático
    for (const [key, imagePath] of Object.entries(categoryImageMap)) {
      if (category.name.toLowerCase().includes(key) || key.includes(category.name.toLowerCase())) {
        return imagePath
      }
    }

    // Finalmente usar imagen por defecto
    return defaultCategoryImage
  }

  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            Explorá nuestras <span className="text-red-600">categorías</span>
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8 md:w-10 md:h-10 border-2" disabled>
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full w-8 h-8 md:w-10 md:h-10 border-2" disabled>
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-1/3 aspect-square bg-gray-200 animate-pulse rounded-lg"></div>
          <div className="w-full md:w-2/3">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 h-full">
              {Array(getSmallCategoriesCount())
                .fill(0)
                .map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-200 animate-pulse"></div>
                ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const gridCols = getGridCols()
  const smallCategoriesCount = getSmallCategoriesCount()
  const maxPage = Math.ceil((categories.length - 1) / smallCategoriesCount) - 1

  return (
    <div className="w-full max-w-7xl mx-auto px-4 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">
          Explorá nuestras <span className="text-red-600">categorías</span>
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8 md:w-10 md:h-10 border-2 hover:bg-gray-100"
            onClick={scrollLeft}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full w-8 h-8 md:w-10 md:h-10 border-2 hover:bg-gray-100"
            onClick={scrollRight}
            disabled={currentPage >= maxPage}
          >
            <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {orderedCategories.length > 0 && (
          <Link
            href={`/search?category=${encodeURIComponent(orderedCategories[0].name)}`}
            className="w-full md:w-1/3 block group"
          >
            <div className="aspect-square rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-end justify-center relative">
                <img
                  src={getCategoryImage(orderedCategories[0]) || "/placeholder.svg"}
                  alt={orderedCategories[0].name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                />
                <div className="w-full p-4 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
                  <h3 className="text-xl font-bold text-white uppercase tracking-wide text-center relative z-10">
                    {orderedCategories[0].name}
                  </h3>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Categorías más pequeñas (organizadas en grid responsive) */}
        <div className="w-full md:w-2/3">
          <div className={`grid grid-cols-${gridCols} gap-4 h-full`}>
            {getPageCategories().map((category, index) => (
              <Link
                href={`/search?category=${encodeURIComponent(category.name)}`}
                key={category.id}
                className="block group"
              >
                <div
                  className={`aspect-square rounded-lg overflow-hidden transition-all duration-300 ease-in-out ${
                    isAnimating ? "opacity-0 scale-95" : "opacity-100 scale-100"
                  }`}
                  style={{
                    transitionDelay: `${isAnimating ? "0ms" : `${index * 50}ms`}`,
                  }}
                >
                  <div className="w-full h-full flex items-end justify-center relative">
                    <img
                      src={getCategoryImage(category) || "/placeholder.svg"}
                      alt={category.name}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-in-out group-hover:scale-110"
                    />
                    <div className="w-full p-2 bg-gradient-to-t from-black/80 to-transparent absolute bottom-0 left-0 right-0">
                      <h3 className="text-xs md:text-sm font-bold text-white uppercase tracking-wide text-center relative z-10">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Indicadores de página */}
      {categories.length > smallCategoriesCount + 1 && (
        <div className="flex justify-center mt-4 gap-1">
          {Array(maxPage + 1)
            .fill(0)
            .map((_, i) => (
              <button
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentPage ? "bg-red-600" : "bg-gray-300"}`}
                onClick={() => {
                  if (i !== currentPage && !isAnimating) {
                    setIsAnimating(true)
                    setTimeout(() => {
                      setCurrentPage(i)
                      setTimeout(() => setIsAnimating(false), 300)
                    }, 150)
                  }
                }}
                aria-label={`Página ${i + 1}`}
              />
            ))}
        </div>
      )}
    </div>
  )
}
