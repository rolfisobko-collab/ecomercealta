"use client"

import type React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart } from "lucide-react"
import type { Product } from "@/models/Product"
import { useCart } from "@/context/CartContext"
import { useToast } from "@/components/ui/use-toast"
import ProductImage from "./ProductImage"
import { FavoriteButton } from "./FavoriteButton"
import { useCurrency } from "@/context/CurrencyContext"
import { useState, useEffect } from "react"
import { fetchExchangeRate, getExchangeRate } from "@/utils/currencyUtils"
import { useGremioUI } from "@/context/GremioUIContext"
import { usePathname } from "next/navigation"

interface ProductCardProps {
  product: Product
  showAddToCart?: boolean
  compact?: boolean
  imageUrl?: string
  priority?: boolean
  onClick?: (e: React.MouseEvent) => void
}

export default function ProductCard({
  product,
  showAddToCart = true,
  compact = false,
  imageUrl,
  priority = false,
  onClick,
}: ProductCardProps) {
  const { addItem } = useCart()
  const { toast } = useToast()
  const { currency: selectedCurrency } = useCurrency()
  const gremioUI = useGremioUI()
  const pathname = usePathname()

  const [exchangeRate, setExchangeRate] = useState<number>(() => {
    // Inicializar con el valor sincrónico (caché o valor por defecto)
    return getExchangeRate("USD", "ARS")
  })

  // Cargar la tasa de cambio actualizada desde Firebase
  useEffect(() => {
    let isMounted = true

    if (selectedCurrency === "ARS" && (product as any)?.currency === "USD") {
      fetchExchangeRate("USD_ARS").then((rate) => {
        if (isMounted) {
          setExchangeRate(rate)
        }
      })
    }

    return () => {
      isMounted = false
    }
  }, [selectedCurrency, (product as any)?.currency])

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (addItem) {
      addItem(product)
      toast({
        title: "Añadido al carrito",
        description: `${product.name} añadido al carrito`,
      })
      if (pathname?.startsWith("/gremio")) {
        gremioUI?.openCart?.()
      }
    }
  }

  // Si hay un manejador de clics personalizado, usamos un div en lugar de Link
  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <Card className="card overflow-hidden group h-full flex flex-col min-h-[280px] relative dark:border-red-600 dark:bg-gray-800/50 transition-all hover:shadow-md dark:hover:shadow-red-900/20">
          <div className="relative aspect-[1/1] overflow-hidden bg-gray-50 dark:bg-gray-800">
            {(() => {
              const primaryUrl = imageUrl || (product as any)?.image1 || (product as any)?.images?.[0]
              const secondaryUrl = (product as any)?.images?.[1] || (product as any)?.image2 || null
              const primaryFade = secondaryUrl ? "transition-opacity group-hover:opacity-0" : ""
              return (
                <>
                  <ProductImage
                    product={product}
                    imageUrl={primaryUrl}
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${primaryFade}`}
                    priority={priority}
                  />
                  {secondaryUrl && (
                    <ProductImage
                      product={product}
                      imageUrl={secondaryUrl}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-0 group-hover:opacity-100"
                      priority={false}
                    />
                  )}
                </>
              )
            })()}

            {/* Botón de favoritos */}
            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton productId={product.id} />
            </div>
            {(product as any)?.liquidation && (
              <div className="absolute top-2 left-2 z-10">
                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-600 text-white shadow">Liquidación</span>
              </div>
            )}
          </div>

          <CardContent className="p-3 flex-1 flex flex-col">
            <div className="flex-1">
              <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
            </div>

            <div className="mt-auto">
              <div className="mb-2">
                <p className="price font-bold text-base">
                  {selectedCurrency === "ARS" && (product as any)?.currency === "USD"
                    ? `${(product.price * exchangeRate).toLocaleString("es-AR")} ARS`
                    : `${product.price} ${(product as any)?.currency || "USD"}`}
                </p>
              </div>

              {showAddToCart && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full border-red-300 hover:bg-red-50 hover:text-red-600 transition-all dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950 dark:hover:border-red-500"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={handleAddToCart}
                  disabled={product.isInStock === false}
                >
                  <ShoppingCart className="h-4 w-4 mr-1" />
                  <span className="text-xs">Agregar</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Comportamiento normal con Link
  return (
    <Link href={`/products/${product.id}`} scroll={true} className="flex-1 flex flex-col">
      <Card className="card overflow-hidden group h-full flex flex-col min-h-[280px] relative dark:border-red-600 dark:bg-gray-800/50 transition-all hover:shadow-md dark:hover:shadow-red-900/20">
        <div className="relative aspect-[1/1] overflow-hidden bg-gray-50 dark:bg-gray-800">
          {(() => {
            const primaryUrl = imageUrl || (product as any)?.image1 || (product as any)?.images?.[0]
            const secondaryUrl = (product as any)?.images?.[1] || (product as any)?.image2 || null
            const primaryFade = secondaryUrl ? "transition-opacity group-hover:opacity-0" : ""
            return (
              <>
                <ProductImage
                  product={product}
                  imageUrl={primaryUrl}
                  className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${primaryFade}`}
                  priority={priority}
                />
                {secondaryUrl && (
                  <ProductImage
                    product={product}
                    imageUrl={secondaryUrl}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 opacity-0 group-hover:opacity-100"
                    priority={false}
                  />
                )}
              </>
            )
          })()}

          {/* Botón de favoritos */}
          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton productId={product.id} />
          </div>
          {(product as any)?.liquidation && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-red-600 text-white shadow">Liquidación</span>
            </div>
          )}
        </div>

        <CardContent className="p-3 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-medium text-sm mb-2 line-clamp-2">{product.name}</h3>
          </div>

          <div className="mt-auto">
            <div className="mb-2">
              <p className="price font-bold text-base">
                {selectedCurrency === "ARS" && (product as any)?.currency === "USD"
                  ? `${(product.price * exchangeRate).toLocaleString("es-AR")} ARS`
                  : `${product.price} ${(product as any)?.currency || "USD"}`}
              </p>
            </div>

            {showAddToCart && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-red-300 hover:bg-red-50 hover:text-red-600 transition-all dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950 dark:hover:border-red-500"
                onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={handleAddToCart}
                disabled={product.isInStock === false}
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                <span className="text-xs">Agregar</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
