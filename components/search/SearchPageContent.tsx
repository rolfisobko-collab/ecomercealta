"use client"

import type React from "react"
import Link from "next/link"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import { useProducts } from "@/hooks/useProducts"
import { useCategories } from "@/hooks/useCategories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { getCategoryIcon } from "@/utils/categoryIcons"
import ProductCard from "@/components/product/ProductCard"
import { Search, SlidersHorizontal, X, Grid, List, Filter, Package, ShoppingCart } from "lucide-react"
import { cn } from "@/lib/utils"
import ProductImage from "@/components/product/ProductImage"
import { useCart } from "@/context/CartContext"

// Función para normalizar texto (eliminar acentos y convertir a minúsculas)
const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

// Función para convertir espacios en guiones y viceversa, con manejo especial para "herramientas e insumos"
const formatForComparison = (text: string): string[] => {
  if (!text) return []

  const normalized = normalizeText(text)
  const result = [
    normalized,
    normalized.replace(/\s+/g, "-"), // Espacios a guiones
    normalized.replace(/-+/g, " "), // Guiones a espacios
  ]

  // Caso especial para "herramientas e insumos"
  if (
    normalized === "herramientas e insumos" ||
    normalized === "herramientas-e-insumos" ||
    normalized === "herramientas-insumos"
  ) {
    result.push("herramientas-insumos")
    result.push("herramientas e insumos")
    result.push("herramientas-e-insumos")
  }

  // Eliminar duplicados
  return [...new Set(result)]
}

// Función para verificar si una categoría coincide con el valor seleccionado
const isCategoryMatch = (category: any, selectedValue: string): boolean => {
  if (!category || !selectedValue) return false

  // Convertir a minúsculas para comparación insensible a mayúsculas
  const selectedLower = selectedValue.toLowerCase()

  // Casos directos
  if (selectedValue === category.id) return true

  const selectedFormats = formatForComparison(selectedValue)
  const categoryFormats = [
    ...formatForComparison(category.name),
    ...(category.slug ? formatForComparison(category.slug) : []),
  ]

  // Verificar si hay alguna coincidencia entre los formatos
  return selectedFormats.some(
    (format) =>
      categoryFormats.includes(format) ||
      categoryFormats.some((catFormat) => catFormat.includes(format) || format.includes(catFormat)),
  )
}

export default function SearchPageContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const initialCategory = searchParams.get("category") || ""
  const includeTags = searchParams.get("includeTags") === "true"

  const [query, setQuery] = useState(initialQuery)
  const [selectedCategory, setSelectedCategory] = useState(initialCategory)
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000])
  const [maxPrice, setMaxPrice] = useState<number>(100000)
  const [availability, setAvailability] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("relevance")
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])

  // Estado para la paginación manual en vista de cuadrícula
  const [itemsToShow, setItemsToShow] = useState(20)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Estado para la paginación por categoría en vista de lista
  const [categoryPages, setCategoryPages] = useState<{ [key: string]: number }>({})
  const ITEMS_PER_PAGE = 5

  // Referencia para el observador de intersección
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Efecto para desplazar al inicio de la página cuando se carga el componente
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const { products, loading: productsLoading } = useProducts(selectedCategory, query, includeTags)

  // Update max price and normalize priceRange when products change
  useEffect(() => {
    if (Array.isArray(products) && products.length > 0) {
      const max = products.reduce((m, p: any) => Math.max(m, Number((p as any)?.price || 0)), 0)
      const safeMax = Math.max(100, Math.ceil(max))
      setMaxPrice(safeMax)
      setPriceRange(([min, curMax]) => {
        const nextMin = Math.max(0, Math.min(min, safeMax))
        const nextMax = Math.min(safeMax, Math.max(nextMin, curMax))
        return [nextMin, nextMax] as [number, number]
      })
    } else {
      setMaxPrice(100000)
      setPriceRange([0, 100000])
    }
  }, [products])
  const { categories, loading: categoriesLoading } = useCategories()
  const { addItem } = useCart()

  // Añadir este efecto para normalizar la categoría seleccionada
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      // Log para depuración
      console.log(`Buscando coincidencia para: ${selectedCategory}`)

      // Si selectedCategory es un nombre en lugar de un ID, buscar el ID correspondiente
      const categoryById = categories.find((c) => c.id === selectedCategory)
      const categoryByName = categories.find((c) => isCategoryMatch(c, selectedCategory))

      if (!categoryById && categoryByName) {
        console.log(`Encontrada coincidencia: ${categoryByName.name} (${categoryByName.id})`)
        // Si encontramos la categoría por nombre pero no por ID, actualizar al ID
        setSelectedCategory(categoryByName.id)
      }
    }
  }, [selectedCategory, categories])

  // Filtrar productos según los filtros aplicados
  const filteredProducts = products.filter((product) => {
    // Verificar que el producto tenga imagen (compat: image1..image5)
    const anyP: any = product as any
    const hasImage =
      Boolean(product.imageUrl) ||
      (Array.isArray(product.images) && product.images.length > 0) ||
      Boolean(anyP?.image1 || anyP?.image2 || anyP?.image3 || anyP?.image4 || anyP?.image5)

    // Verificar que el producto tenga precio y sea mayor que 0
    const priceNum = Number(product.price || 0)
    const hasPrice = priceNum > 0

    // Si no tiene imagen o precio, no mostrar el producto
    if (!hasImage || !hasPrice) {
      return false
    }

    // Filtro de precio
    const pnum = Number(product.price || 0)
    if (pnum < priceRange[0] || pnum > priceRange[1]) {
      return false
    }

    // Filtro de disponibilidad
    if (availability.includes("inStock") && !product.isInStock) {
      return false
    }

    return true
  })

  // Ordenar productos
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case "priceAsc":
        return a.price - b.price
      case "priceDesc":
        return b.price - a.price
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })

  // Productos a mostrar (paginados)
  const visibleProducts = sortedProducts.slice(0, itemsToShow)
  const hasMoreProducts = visibleProducts.length < sortedProducts.length

  // Función para cargar más productos
  const loadMoreProducts = useCallback(() => {
    if (isLoadingMore || !hasMoreProducts) return

    setIsLoadingMore(true)

    // Simular una carga con un pequeño retraso
    setTimeout(() => {
      setItemsToShow((prev) => prev + 20)
      setIsLoadingMore(false)
    }, 500)
  }, [isLoadingMore, hasMoreProducts])

  // Configurar el observador de intersección para carga infinita
  useEffect(() => {
    if (viewMode !== "grid") return

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    }

    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries
      if (entry.isIntersecting && hasMoreProducts && !isLoadingMore) {
        loadMoreProducts()
      }
    }, options)

    observerRef.current = observer

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loadMoreProducts, hasMoreProducts, isLoadingMore, visibleProducts.length, viewMode])

  // Reiniciar la paginación cuando cambian los filtros
  useEffect(() => {
    setItemsToShow(20)
  }, [query, selectedCategory, priceRange, availability, sortBy])

  // Actualizar filtros activos
  useEffect(() => {
    const filters = []

    if (query) filters.push(`Búsqueda: ${query}`)
    if (selectedCategory) {
      // Buscar la categoría por ID o por nombre
      const category = categories.find((c) => c.id === selectedCategory || isCategoryMatch(c, selectedCategory))
      if (category) filters.push(`Categoría: ${category.name}`)
    }
    if (priceRange[0] > 0 || priceRange[1] < 1000) {
      filters.push(`Precio: ${priceRange[0]} - ${priceRange[1]}`)
    }
    if (availability.length > 0) {
      filters.push("Solo productos en stock")
    }

    setActiveFilters(filters)
  }, [query, selectedCategory, priceRange, availability, categories])

  // Manejar la búsqueda
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // En una aplicación real, aquí actualizaríamos la URL con los parámetros de búsqueda
  }

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setQuery("")
    setSelectedCategory("")
    setPriceRange([0, 1000])
    setAvailability([])
    setSortBy("relevance")
  }

  // Eliminar un filtro específico
  const removeFilter = (filter: string) => {
    if (filter.startsWith("Búsqueda:")) {
      setQuery("")
    } else if (filter.startsWith("Categoría:")) {
      setSelectedCategory("")
    } else if (filter.startsWith("Precio:")) {
      setPriceRange([0, 1000])
    } else if (filter === "Solo productos en stock") {
      setAvailability([])
    }
  }

  // Modifique la lógica de renderizado en el modo lista para agrupar por categoría y agregar paginación:
  const groupProductsByCategory = (products) => {
    console.log(`Agrupando ${products.length} productos por categoría`)
    const grouped = {}
    products.forEach((product) => {
      // Corregido: usar product.category en lugar de product.categoryId
      const categoryId = product.category || "uncategorized"
      if (!grouped[categoryId]) {
        grouped[categoryId] = []
      }
      grouped[categoryId].push(product)
    })
    return grouped
  }

  // Función para cambiar de página por categoría
  const changePage = (categoryId: string, page: number) => {
    setCategoryPages((prev) => ({
      ...prev,
      [categoryId]: page,
    }))
    // Se eliminó el window.scrollTo(0, 0) para evitar el desplazamiento automático
  }

  // Reiniciar la paginación cuando cambian los filtros o el modo de visualización
  useEffect(() => {
    setCategoryPages({})
  }, [query, selectedCategory, priceRange, availability, sortBy, viewMode])

  // Función para obtener el nombre de la categoría
  const getCategoryName = (categoryId) => {
    const category = categories.find((cat) => cat.id === categoryId)
    return category ? category.name : "Sin categoría"
  }

  // Agrupar productos por categoría para el modo lista
  const groupedProducts =
    viewMode === "list"
      ? groupProductsByCategory(sortedProducts) // Usar todos los productos filtrados en modo lista
      : {}

  // Asegurar que cuando se cambia al modo lista, se carguen todos los productos
  useEffect(() => {
    if (viewMode === "list") {
      // En modo lista, queremos mostrar todos los productos
      setItemsToShow(sortedProducts.length)
    }
  }, [viewMode, sortedProducts.length])

  return (
    <div className="container mx-auto px-4 py-8 md:px-6 md:py-12 max-w-7xl dark:border-2 dark:border-red-600 dark:rounded-xl dark:bg-gray-900/20 dark:shadow-lg dark:shadow-red-900/10">
      {/* Encabezado de búsqueda */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Resultados de búsqueda</h1>
        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar productos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 dark:border-red-600/50 focus:dark:border-red-500"
            />
          </div>
          <Button type="submit" className="bg-red-600 hover:bg-red-700 dark:border dark:border-red-400">
            Buscar
          </Button>
        </form>
      </div>

      {/* Filtros activos */}
      {activeFilters.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">Filtros activos:</span>
            {activeFilters.map((filter) => (
              <Badge
                key={filter}
                variant="outline"
                className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              >
                {filter}
                <button onClick={() => removeFilter(filter)} className="ml-1">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Limpiar todos
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Panel de filtros para móvil */}
        <div className="lg:hidden flex justify-between items-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </Button>

          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px] dark:border-red-600/50">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="priceAsc">Precio: Menor a Mayor</SelectItem>
                <SelectItem value="priceDesc">Precio: Mayor a Menor</SelectItem>
                <SelectItem value="newest">Más recientes</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md dark:border-red-600">
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-none", viewMode === "grid" && "bg-gray-100")}
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn("rounded-none", viewMode === "list" && "bg-gray-100")}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Panel de filtros para móvil (desplegable) */}
        {isFilterOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-50 flex justify-end">
            <div className="bg-white dark:bg-gray-950 w-4/5 h-full overflow-auto p-4 animate-in slide-in-from-right">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Filtros</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="space-y-6">
                {/* Filtro por categoría */}
                <div>
                  <h3 className="font-medium mb-2">Categorías</h3>
                  <div className="space-y-1 max-h-[200px] overflow-y-auto">
                    {categoriesLoading ? (
                      <p>Cargando categorías...</p>
                    ) : (
                      categories.map((category) => {
                        const IconComponent = getCategoryIcon(category.name)
                        // Verificar si la categoría está seleccionada
                        const isSelected = isCategoryMatch(category, selectedCategory)

                        return (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-mobile-${category.id}`}
                              checked={isSelected}
                              onCheckedChange={() => setSelectedCategory(isSelected ? "" : category.id)}
                            />
                            <label
                              htmlFor={`category-mobile-${category.id}`}
                              className="flex items-center text-sm cursor-pointer"
                            >
                              <IconComponent className="mr-2 h-4 w-4 text-red-600" />
                              {category.name}
                            </label>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>

                {/* Filtro por precio */}
                <div>
                  <h3 className="font-medium mb-2">Precio</h3>
                  <div className="px-2">
                    <Slider
                      max={maxPrice}
                      step={10}
                      value={priceRange}
                      onValueChange={(val) => setPriceRange([val[0], val[1]] as [number, number])}
                      className="mb-6"
                    />
                    <div className="flex items-center justify-between">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Filtro por disponibilidad */}
                <div>
                  <h3 className="font-medium mb-2">Disponibilidad</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="in-stock-mobile"
                        checked={availability.includes("inStock")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAvailability([...availability, "inStock"])
                          } else {
                            setAvailability(availability.filter((a) => a !== "inStock"))
                          }
                        }}
                      />
                      <label htmlFor="in-stock-mobile" className="text-sm cursor-pointer">
                        Solo productos en stock
                      </label>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-red-600 hover:bg-red-700 mt-4" onClick={() => setIsFilterOpen(false)}>
                  Ver resultados
                </Button>

                <Button variant="outline" className="w-full mt-2" onClick={clearAllFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Panel de filtros (escritorio) */}
        <div className={cn("hidden", viewMode === "grid" ? "lg:block w-1/4" : "lg:hidden", "space-y-6")}>
          <div className="rounded-lg border shadow-sm p-6 dark:border-red-600 dark:bg-gray-900/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center">
                <SlidersHorizontal className="mr-2 h-5 w-5 text-red-600" />
                Filtros
              </h2>
              {activeFilters.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
                >
                  Limpiar
                </Button>
              )}
            </div>

            <Accordion type="multiple" defaultValue={["categories", "price", "availability"]} className="space-y-4">
              {/* Filtro por categoría */}
              <AccordionItem value="categories" className="border-b-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="text-sm font-medium">Categorías</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 max-h-[300px] overflow-y-auto pr-2">
                    {categoriesLoading ? (
                      <p>Cargando categorías...</p>
                    ) : (
                      categories.map((category) => {
                        const IconComponent = getCategoryIcon(category.name)
                        // Verificar si la categoría está seleccionada
                        const isSelected = isCategoryMatch(category, selectedCategory)

                        return (
                          <div key={category.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category.id}`}
                              checked={isSelected}
                              onCheckedChange={() => setSelectedCategory(isSelected ? "" : category.id)}
                            />
                            <label
                              htmlFor={`category-${category.id}`}
                              className="flex items-center text-sm cursor-pointer"
                            >
                              <IconComponent className="mr-2 h-4 w-4 text-red-600" />
                              {category.name}
                            </label>
                          </div>
                        )
                      })
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Filtro por precio */}
              <AccordionItem value="price" className="border-b-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="text-sm font-medium">Precio</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-2">
                    <Slider
                      max={maxPrice}
                      step={10}
                      value={priceRange}
                      onValueChange={(val) => setPriceRange([val[0], val[1]] as [number, number])}
                      className="mb-6"
                    />
                    <div className="flex items-center justify-between">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Filtro por disponibilidad */}
              <AccordionItem value="availability" className="border-b-0">
                <AccordionTrigger className="py-2 hover:no-underline">
                  <span className="text-sm font-medium">Disponibilidad</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="in-stock"
                        checked={availability.includes("inStock")}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setAvailability([...availability, "inStock"])
                          } else {
                            setAvailability(availability.filter((a) => a !== "inStock"))
                          }
                        }}
                      />
                      <label htmlFor="in-stock" className="text-sm cursor-pointer">
                        Solo productos en stock
                      </label>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        <div className="flex-1 dark:bg-gray-900/30 rounded-lg p-2 dark:border-2 dark:border-red-600">
          {/* Controles de visualización (escritorio) */}
          <div className="hidden lg:flex justify-between items-center mb-6">
            <div className="text-sm text-gray-500">
              Mostrando <span className="font-medium text-gray-900 dark:text-white">{visibleProducts.length}</span> de{" "}
              <span className="font-medium text-gray-900 dark:text-white">{sortedProducts.length}</span> resultados
            </div>

            <div className="flex items-center gap-4">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[220px] dark:border-red-600/50">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevancia</SelectItem>
                  <SelectItem value="priceAsc">Precio: Menor a Mayor</SelectItem>
                  <SelectItem value="priceDesc">Precio: Mayor a Menor</SelectItem>
                  <SelectItem value="newest">Más recientes</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex border rounded-md dark:border-red-600">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("rounded-none", viewMode === "grid" && "bg-gray-100")}
                  onClick={() => setViewMode("grid")}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn("rounded-none", viewMode === "list" && "bg-gray-100")}
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Resultados */}
          {productsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Package className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No se encontraron productos</h3>
              <p className="text-gray-500 max-w-md">
                No hemos encontrado productos que coincidan con tu búsqueda. Intenta con otros términos o ajusta los
                filtros.
              </p>
              <Button variant="outline" className="mt-4 dark:border-red-600" onClick={clearAllFilters}>
                Limpiar filtros
              </Button>
            </div>
          ) : (
            <>
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 [.dark_&]:has-children-with-red-border">
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} compact={true} />
                  ))}
                </div>
              ) : (
                <div className="space-y-8">
                  {Object.entries(groupedProducts).map(([categoryId, products]) => {
                    // Obtener el nombre de la categoría
                    const categoryName = getCategoryName(categoryId)

                    // Obtener la página actual para esta categoría o establecer 1 como predeterminado
                    const currentCategoryPage = categoryPages[categoryId] || 1

                    // Calcular el total de páginas para esta categoría
                    const categoryTotalPages = Math.ceil(products.length / ITEMS_PER_PAGE)

                    // Calcular índices de inicio y fin para esta categoría basados en su página actual
                    const categoryProductsToShow = products.slice(
                      (currentCategoryPage - 1) * ITEMS_PER_PAGE,
                      currentCategoryPage * ITEMS_PER_PAGE,
                    )

                    // Mostrar todas las categorías, incluso si no tienen productos en la página actual
                    return (
                      <div
                        key={categoryId}
                        className="border rounded-lg overflow-hidden dark:border-red-600 dark:bg-gray-800/30 shadow-sm"
                      >
                        <div className="bg-gray-100 dark:bg-gray-800 py-2 px-3 border-b dark:border-red-600 flex justify-between items-center">
                          <h3 className="font-medium text-sm">{categoryName}</h3>
                          <span className="text-xs text-gray-500">
                            {products.length} producto{products.length !== 1 ? "s" : ""}
                          </span>
                        </div>

                        {categoryProductsToShow.length > 0 ? (
                          <div className="divide-y dark:divide-red-600/20">
                            {categoryProductsToShow.map((product) => (
                              <div
                                key={product.id}
                                className="flex flex-row overflow-hidden hover:bg-gray-50 dark:hover:bg-gray-800/80 transition-colors group"
                              >
                                <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 p-2">
                                  <div className="w-full h-full rounded-md overflow-hidden">
                                    <ProductImage product={product} className="w-full h-full object-cover" />
                                  </div>
                                </div>
                                <div className="flex-1 py-2 px-3 flex flex-col justify-center">
                                  <h3 className="font-medium text-base mb-3 line-clamp-1">{product.name}</h3>
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-red-600 dark:text-red-400">
                                      ${product.price} {product.currency}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        asChild
                                        className="dark:border-red-600"
                                      >
                                        <Link href={`/products/${product.id}`}>Ver detalles</Link>
                                      </Button>
                                      <Button
                                        size="sm"
                                        className="bg-red-600 hover:bg-red-700 opacity-90 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          addItem(product)
                                        }}
                                      >
                                        <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                                        Añadir
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center text-gray-500">
                            No hay productos en esta categoría que coincidan con los filtros aplicados.
                          </div>
                        )}

                        {/* Paginación por categoría */}
                        {categoryTotalPages > 1 && (
                          <div className="flex justify-center py-3 border-t dark:border-red-600/20">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => changePage(categoryId, currentCategoryPage - 1)}
                                disabled={currentCategoryPage === 1}
                                className="dark:border-red-600 h-7 px-2"
                              >
                                Anterior
                              </Button>
                              <div className="flex items-center space-x-1">
                                {Array.from({ length: Math.min(5, categoryTotalPages) }, (_, i) => {
                                  // Si hay más de 5 páginas, mostrar páginas inteligentemente
                                  let pageToShow = i + 1
                                  if (categoryTotalPages > 5) {
                                    if (currentCategoryPage <= 3) {
                                      // Al inicio: mostrar páginas 1-4 y última
                                      if (i < 4) {
                                        pageToShow = i + 1
                                      } else {
                                        pageToShow = categoryTotalPages
                                      }
                                    } else if (currentCategoryPage >= categoryTotalPages - 2) {
                                      // Al final: mostrar primera y últimas 4
                                      if (i === 0) {
                                        pageToShow = 1
                                      } else {
                                        pageToShow = categoryTotalPages - (4 - i)
                                      }
                                    } else {
                                      // En medio: mostrar actual ±1, primera y última
                                      if (i === 0) {
                                        pageToShow = 1
                                      } else if (i === 4) {
                                        pageToShow = categoryTotalPages
                                      } else {
                                        pageToShow = currentCategoryPage + (i - 2)
                                      }
                                    }
                                  }

                                  return (
                                    <Button
                                      key={pageToShow}
                                      variant={currentCategoryPage === pageToShow ? "default" : "outline"}
                                      size="sm"
                                      onClick={() => changePage(categoryId, pageToShow)}
                                      className={`${currentCategoryPage === pageToShow ? "bg-red-600 hover:bg-red-700" : "dark:border-red-600"} h-7 min-w-[28px] px-0`}
                                    >
                                      {pageToShow}
                                    </Button>
                                  )
                                })}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => changePage(categoryId, currentCategoryPage + 1)}
                                disabled={currentCategoryPage === categoryTotalPages}
                                className="dark:border-red-600 h-7 px-2"
                              >
                                Siguiente
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Elemento de observación para carga infinita */}
              {hasMoreProducts && viewMode === "grid" && (
                <div ref={loadMoreRef} className="mt-8 py-4 flex justify-center">
                  {isLoadingMore && (
                    <div className="flex items-center space-x-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
                      <span className="text-sm text-gray-500">Cargando más productos...</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
