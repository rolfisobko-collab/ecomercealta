"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useCategories } from "@/hooks/useCategories"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import CategoryCard from "./CategoryCard"

// Categorías destacadas que queremos mostrar primero
const FEATURED_CATEGORIES = [
  "Baterías",
  "Modulos",
  "Camaras",
  "Tapas",
  "Glass",
  "Celular",
  "Accesorios",
  "Herramientas e insumos",
]

export default function CategoryCarousel() {
  const { categories, loading } = useCategories()
  const [visibleCategories, setVisibleCategories] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  // Añadir un estado para controlar la reproducción automática y un intervalo
  const [autoplay, setAutoplay] = useState(true)
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Número de categorías a mostrar según el ancho de la pantalla
  const getItemsToShow = () => {
    if (typeof window === "undefined") return 4
    if (window.innerWidth < 640) return 1
    if (window.innerWidth < 768) return 2
    if (window.innerWidth < 1024) return 3
    return 4
  }

  const [itemsToShow, setItemsToShow] = useState(4)

  useEffect(() => {
    const handleResize = () => {
      setItemsToShow(getItemsToShow())
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    if (!loading && categories.length > 0) {
      // Ordenar categorías para que las destacadas aparezcan primero
      const sortedCategories = [...categories].sort((a, b) => {
        const aIndex = FEATURED_CATEGORIES.indexOf(a.name)
        const bIndex = FEATURED_CATEGORIES.indexOf(b.name)

        if (aIndex === -1 && bIndex === -1) return 0
        if (aIndex === -1) return 1
        if (bIndex === -1) return -1
        return aIndex - bIndex
      })

      setVisibleCategories(sortedCategories)
    }
  }, [categories, loading])

  // Añadir este useEffect para manejar el autoplay
  useEffect(() => {
    if (autoplay && visibleCategories.length > 0) {
      autoplayIntervalRef.current = setInterval(() => {
        nextSlide()
      }, 5000) // Cambiar cada 5 segundos
    }

    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current)
      }
    }
  }, [autoplay, currentIndex, visibleCategories.length])

  // Modificar las funciones de interacción para pausar el autoplay temporalmente
  const pauseAutoplay = () => {
    setAutoplay(false)
    // Reanudar después de 10 segundos de inactividad
    setTimeout(() => setAutoplay(true), 10000)
  }

  // Actualizar las funciones existentes para pausar el autoplay
  const nextSlide = () => {
    if (currentIndex + itemsToShow >= visibleCategories.length) {
      setCurrentIndex(0)
    } else {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const prevSlide = () => {
    if (currentIndex === 0) {
      setCurrentIndex(Math.max(0, visibleCategories.length - itemsToShow))
    } else {
      setCurrentIndex(Math.max(0, currentIndex - 1))
    }
  }

  // Actualizar los manejadores de eventos para pausar el autoplay
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    setIsDragging(true)
    pauseAutoplay()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart) {
      setTouchEnd(e.targetTouches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    setIsDragging(false)
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      nextSlide()
    } else if (isRightSwipe) {
      prevSlide()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  // Manejo de eventos de mouse para arrastrar
  const handleMouseDown = (e: React.MouseEvent) => {
    setTouchStart(e.clientX)
    setIsDragging(true)
    pauseAutoplay()
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (touchStart && isDragging) {
      setTouchEnd(e.clientX)
    }
  }

  const handleMouseUp = () => {
    if (isDragging) {
      handleTouchEnd()
    }
  }

  const handleMouseLeave = () => {
    if (isDragging) {
      handleTouchEnd()
    }
  }

  if (loading) {
    return (
      <div className="relative">
        <div className="flex space-x-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-full min-w-[250px] flex-none">
              <Skeleton className="h-[180px] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4 mx-auto mt-3" />
              <Skeleton className="h-3 w-1/2 mx-auto mt-2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (visibleCategories.length === 0) {
    return <div className="text-center text-gray-500">No se encontraron categorías</div>
  }

  return (
    <div className="relative group z-50">
      {/* Botones de navegación discretos que solo aparecen en hover */}
      <div className="absolute top-1/2 -translate-y-1/2 w-full z-30 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="flex justify-between pointer-events-auto cursor-pointer">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 text-red-600 hover:bg-white hover:text-red-700 shadow-md border border-red-100/50 dark:bg-gray-800/80 dark:text-red-400 dark:hover:bg-gray-800 dark:border-red-900/30 h-9 w-9"
            onClick={() => {
              prevSlide()
              pauseAutoplay()
            }}
            aria-label="Categoría anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full bg-white/80 text-red-600 hover:bg-white hover:text-red-700 shadow-md border border-red-100/50 dark:bg-gray-800/80 dark:text-red-400 dark:hover:bg-gray-800 dark:border-red-900/30 h-9 w-9"
            onClick={() => {
              nextSlide()
              pauseAutoplay()
            }}
            aria-label="Categoría siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contenedor con eventos táctiles */}
      <div
        ref={containerRef}
        className="flex space-x-4 overflow-hidden px-2 cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        {visibleCategories.slice(currentIndex, currentIndex + itemsToShow).map((category) => (
          <div key={category.id} className={`w-full min-w-[calc(100%/${itemsToShow})] flex-none`}>
            <CategoryCard category={category} showNavigation={false} />
          </div>
        ))}
      </div>

      {/* Indicadores de página */}
      <div className="flex justify-center mt-6 space-x-3">
        {Array.from({ length: Math.ceil(visibleCategories.length / itemsToShow) }).map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full transition-all border ${
              Math.floor(currentIndex / itemsToShow) === i
                ? "border-red-600 scale-125"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => setCurrentIndex(i * itemsToShow)}
            aria-label={`Ir a página ${i + 1}`}
          />
        ))}
      </div>

      {/* Instrucciones visuales para dispositivos táctiles */}
      <div className="text-center text-xs text-gray-500 mt-4 md:hidden">Desliza para ver más categorías</div>
    </div>
  )
}
