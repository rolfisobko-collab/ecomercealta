"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import { Product } from "@/models/Product"

// Reemplazar la interfaz Brand con esta:
interface Brand {
  id: string
  name: string
  logo: string
  bgColor?: string
  textColor?: string
}

export default function BrandProducts() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [activeBrand, setActiveBrand] = useState<string>("")
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [currentPage, setCurrentPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasBrandedProducts, setHasBrandedProducts] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Cargar marcas y productos
  useEffect(() => {
    const fetchBrandsAndProducts = async () => {
      setLoading(true)
      try {
        // Obtener marcas
        const brandsCollection = collection(db, "brands")
        const brandsSnapshot = await getDocs(brandsCollection)

        if (brandsSnapshot.empty) {
          setHasBrandedProducts(false)
          setLoading(false)
          return
        }

        const brandsData = brandsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Brand[]

        setBrands(brandsData)

        // Verificar si hay productos con marcas
        const productsCollection = collection(db, "stock")
        const productsWithBrandsQuery = query(productsCollection, where("brandId", "!=", null))

        try {
          const productsSnapshot = await getDocs(productsWithBrandsQuery)

          if (productsSnapshot.empty) {
            setHasBrandedProducts(false)
            setLoading(false)
            return
          }

          setHasBrandedProducts(true)

          // Si hay marcas, establecer la primera como activa
          if (brandsData.length > 0) {
            setActiveBrand(brandsData[0].id)
            await fetchProductsByBrand(brandsData[0].id)
          }
        } catch (error) {
          console.error("Error al verificar productos con marcas:", error)
          setHasBrandedProducts(false)
        }
      } catch (error) {
        console.error("Error al cargar marcas:", error)
        setHasBrandedProducts(false)
      }
      setLoading(false)
    }

    fetchBrandsAndProducts()
  }, [])

  // Función para obtener productos por marca
  const fetchProductsByBrand = async (brandId: string) => {
    try {
      const productsCollection = collection(db, "stock")
      const q = query(productsCollection, where("brandId", "==", brandId))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        setFilteredProducts([])
        return
      }

      const products = snapshot.docs.map((doc) => {
        const data = doc.data()
        return new Product({
          id: doc.id,
          name: data.name || "",
          description: data.description || "",
          price: data.price || 0,
          cost: data.cost || 0,
          currency: data.currency || "USD",
          quantity: data.quantity || 0,
          category: data.category || "",
          location: data.location || "",
          obs: data.obs || "",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          images: data.images || [],
          image1: data.image1 || "",
          image2: data.image2 || "",
          image3: data.image3 || "",
          image4: data.image4 || "",
          image5: data.image5 || "",
          youtubeVideoId: data.youtubeVideoId || null,
          youtubeUrl: data.youtubeUrl || "",
        })
      })

      setFilteredProducts(products)
    } catch (error) {
      console.error(`Error al obtener productos para la marca ${brandId}:`, error)
      setFilteredProducts([])
    }
  }

  // Actualizar el número total de páginas basado en productos y tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)

      let itemsPerPage = 1
      if (window.innerWidth >= 1280) {
        itemsPerPage = 4
      } else if (window.innerWidth >= 1024) {
        itemsPerPage = 3
      } else if (window.innerWidth >= 768) {
        itemsPerPage = 2
      }

      setTotalPages(Math.ceil(filteredProducts.length / itemsPerPage))
      setCurrentPage(0) // Reset to first page when changing brands or resizing
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [filteredProducts])

  // Manejar cambio de marca
  const handleBrandChange = async (brandId: string) => {
    setActiveBrand(brandId)
    setCurrentPage(0)
    await fetchProductsByBrand(brandId)
  }

  // Navegar a la página anterior
  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
      scrollCarousel(-1)
    }
  }

  // Navegar a la página siguiente
  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1)
      scrollCarousel(1)
    }
  }

  // Función para desplazar el carrusel
  const scrollCarousel = (direction: number) => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.offsetWidth
      carouselRef.current.scrollBy({
        left: scrollAmount * direction,
        behavior: "smooth",
      })
    }
  }

  // Formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  // Si no hay productos con marcas o está cargando, no mostrar el componente
  if (!hasBrandedProducts || loading) {
    return null
  }

  return (
    <section className="w-full py-10 bg-white dark:bg-gray-950">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Descubrí las <span className="text-red-600 dark:text-red-500">mejores marcas</span>
          </h2>

          {/* Botones de navegación para escritorio */}
          <div className="hidden md:flex space-x-2">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
              onClick={prevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="sr-only">Página anterior</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="h-5 w-5" />
              <span className="sr-only">Página siguiente</span>
            </Button>
          </div>
        </div>

        {/* Selector de marcas con scroll horizontal */}
        <div className="relative mb-8">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 shadow-sm hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
              onClick={() => {
                const container = document.getElementById("brands-container")
                if (container) container.scrollBy({ left: -200, behavior: "smooth" })
              }}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          <div id="brands-container" className="flex overflow-x-auto py-2 px-8 md:px-0 space-x-3 scrollbar-hide">
            {brands.map((brand) => (
              <Button
                key={brand.id}
                variant="outline"
                className={cn(
                  "min-w-max rounded-full px-5 py-2 transition-all",
                  activeBrand === brand.id
                    ? "bg-red-600 text-white border-red-600 hover:bg-red-700 hover:border-red-700"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800",
                )}
                onClick={() => handleBrandChange(brand.id)}
              >
                {brand.name}
              </Button>
            ))}
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 md:hidden">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 shadow-sm hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
              onClick={() => {
                const container = document.getElementById("brands-container")
                if (container) container.scrollBy({ left: 200, behavior: "smooth" })
              }}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Carrusel de productos */}
        <div className="relative">
          {/* Botones de navegación móvil */}
          <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 shadow-sm hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
              onClick={prevPage}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          <div
            ref={carouselRef}
            className="grid grid-flow-col auto-cols-[100%] sm:auto-cols-[calc(50%-0.75rem)] md:auto-cols-[calc(33.33%-1rem)] lg:auto-cols-[calc(25%-1rem)] gap-6 overflow-x-hidden snap-x snap-mandatory"
          >
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.id}`} className="snap-start">
                  <Card className="overflow-hidden h-full transition-all hover:shadow-md">
                    <CardContent className="p-0">
                      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-800">
                        <Image
                          src={product.image1 || "/placeholder.svg"}
                          alt={product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <h3 className="text-lg font-semibold mb-4 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold text-red-600 dark:text-red-500">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-gray-500 dark:text-gray-400">No hay productos disponibles para esta marca</p>
              </div>
            )}
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-white/80 shadow-sm hover:bg-white dark:bg-gray-800/80 dark:hover:bg-gray-800"
              onClick={nextPage}
              disabled={currentPage === totalPages - 1}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Indicadores de página */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 gap-2">
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentPage === index ? "bg-red-600 w-4" : "bg-gray-300 dark:bg-gray-700"
                }`}
                onClick={() => setCurrentPage(index)}
                aria-label={`Ir a la página ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
