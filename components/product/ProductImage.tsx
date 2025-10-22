"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import type { Product } from "@/models/Product"
import { cn } from "@/lib/utils"

interface ProductImageProps {
  product: Product
  imageUrl?: string
  className?: string
  priority?: boolean
  enableZoom?: boolean // Prop para activar/desactivar el zoom
}

export default function ProductImage({
  product,
  imageUrl,
  className = "",
  priority = false,
  enableZoom = false, // Por defecto desactivado
}: ProductImageProps) {
  const [src, setSrc] = useState<string>("/placeholder.svg?height=400&width=400")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadImage = async () => {
      if (!imageUrl && (!product.images || product.images.length === 0)) {
        setLoading(false)
        return
      }

      try {
        // Priorizar la URL específica, luego image1, luego la primera imagen del array
        const imageToUse = imageUrl || product.image1 || (product.images && product.images[0])

        if (!imageToUse) {
          setLoading(false)
          return
        }

        // Verificar si la URL es válida
        if (typeof imageToUse === "string" && imageToUse.trim() !== "") {
          setSrc(imageToUse)
        }
      } catch (err) {
        console.error("Error al cargar la imagen:", err)
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    loadImage()
  }, [imageUrl, product])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !enableZoom) return

    const { left, top, width, height } = containerRef.current.getBoundingClientRect()

    // Calcular posición relativa del cursor (0 a 1)
    const x = Math.max(0, Math.min(1, (e.clientX - left) / width))
    const y = Math.max(0, Math.min(1, (e.clientY - top) / height))

    setZoomPosition({ x, y })
  }

  if (loading) {
    return <Skeleton className={`${className} bg-gray-200 dark:bg-gray-700`} />
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative overflow-hidden bg-white dark:bg-gray-900 p-0 rounded-md flex items-center justify-center",
        enableZoom && "cursor-zoom-in",
        className,
      )}
      onMouseEnter={() => enableZoom && setIsZoomed(true)}
      onMouseLeave={() => enableZoom && setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Imagen normal */}
      <img
        src={src || "/placeholder.svg?height=400&width=400"}
        alt={product.name || "Producto"}
        className={cn("w-full h-full object-contain max-h-[300px]", enableZoom && isZoomed && "opacity-0")}
        onError={() => {
          setSrc("/placeholder.svg?height=400&width=400")
          setError(true)
        }}
        loading={priority ? "eager" : "lazy"}
      />

      {/* Imagen con zoom */}
      {enableZoom && isZoomed && !error && (
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            backgroundImage: `url(${src})`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "200%", // 2x zoom
            backgroundPosition: `${zoomPosition.x * 100}% ${zoomPosition.y * 100}%`,
          }}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 bg-opacity-50">
          <span className="text-xs text-gray-500 dark:text-gray-400">Imagen no disponible</span>
        </div>
      )}
    </div>
  )
}
