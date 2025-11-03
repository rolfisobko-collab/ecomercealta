"use client"

import type React from "react"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ShoppingBag } from "lucide-react"
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
          setExchangeRate((prev) => {
            if (typeof prev === 'number' && prev > 0) {
              const delta = Math.abs(rate - prev) / prev
              if (delta < 0.01) return prev
            }
            return rate
          })
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

  // Utilidad para formatear el precio según moneda seleccionada
  const renderPrice = () => {
    const pCur = (product as any)?.currency || "USD"
    if (selectedCurrency === "ARS" && pCur === "USD") {
      const ars = product.price * exchangeRate
      return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(ars)
    }
    // Mostrar USD formateado o ARS si ya viene en ARS
    const currency = selectedCurrency === "ARS" && pCur === "ARS" ? "ARS" : pCur
    const locale = currency === "ARS" ? "es-AR" : "en-US"
    return new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(product.price)
  }

  const renderPoints = () => {
    const anyP: any = product
    const stored = Number(anyP?.points)
    if (!Number.isNaN(stored) && stored > 0) {
      return Math.round(stored).toLocaleString('es-AR')
    }
    const price = Number(anyP?.price || 0)
    const pCur = String(anyP?.currency || 'USD')
    const rate = Number(exchangeRate) || 1
    // Convert displayed sale price to USD and use directly
    const saleUSD = pCur === 'ARS' ? (rate > 0 ? price / rate : price) : price
    const pts = Math.max(0, Math.round(saleUSD * 100))
    return pts.toLocaleString('es-AR')
  }

  // Si hay un manejador de clics personalizado, usamos un div en lugar de Link
  if (onClick) {
    return (
      <div onClick={onClick} className="cursor-pointer">
        <Card className="card overflow-hidden group h-[300px] md:h-[360px] flex flex-col relative border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900/50 rounded-2xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
          <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-2 md:p-3">
            {(() => {
              const primaryUrl = imageUrl || (product as any)?.image1 || (product as any)?.images?.[0]
              const secondaryUrl = (product as any)?.images?.[1] || (product as any)?.image2 || null
              const primaryFade = secondaryUrl ? "transition-opacity group-hover:opacity-0" : ""
              return primaryUrl ? (
                <>
                  <ProductImage
                    product={product}
                    imageUrl={primaryUrl}
                    className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${primaryFade}`}
                    priority={priority}
                  />
                  {secondaryUrl && (
                    <ProductImage
                      product={product}
                      imageUrl={secondaryUrl}
                      className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 opacity-0 group-hover:opacity-100 p-3"
                      priority={false}
                    />
                  )}
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                    <ShoppingBag className="h-16 w-16 md:h-20 md:w-20" />
                  </div>
                </div>
              )
            })()}

            <div className="absolute top-2 right-2 z-10">
              <FavoriteButton productId={product.id} />
            </div>
            {(product as any)?.liquidation && (
              <div className="absolute top-2 left-2 z-10">
                <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-600 text-white shadow">Liquidación</span>
              </div>
            )}
            {(product as any)?.weeklyOffer && !((product as any)?.liquidation) && (
              <div className="absolute top-2 left-2 z-10">
                <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-amber-500 text-white shadow">Oferta semana</span>
              </div>
            )}
            {product.isInStock === false && (
              <div className="absolute bottom-2 left-2 z-10">
                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-gray-900/80 text-white shadow">Sin stock</span>
              </div>
            )}
          </div>

          <CardContent className="p-3 flex-1 flex flex-col">
            <div className="flex-1">
              <h3 className="font-semibold text-[13px] mb-2 line-clamp-2 h-10 text-gray-900 dark:text-gray-100">{product.name}</h3>
            </div>

            <div className="mt-auto">
              <div className="mb-2">
                <p className={`price font-extrabold text-lg ${ (product as any)?.liquidation ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{renderPrice()}</p>
                <p className="text-[11px] text-amber-600 mt-0.5">Gana {renderPoints()} pts</p>
              </div>

              <div className="flex flex-col md:flex-row gap-2 min-h-[2.5rem]">
                {showAddToCart && (
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="flex-1 w-full md:w-auto h-10 md:h-9 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
                    onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={handleAddToCart}
                    disabled={product.isInStock === false}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    <span className="text-sm">Agregar</span>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Comportamiento normal con Link
  const href = pathname?.startsWith("/gremio") ? `/gremio/products/${product.id}` : `/products/${product.id}`
  return (
    <Link href={href} prefetch scroll={true} className="flex-1 flex flex-col">
      <Card className="card overflow-hidden group h-[300px] md:h-[360px] flex flex-col relative border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-gray-900/50 rounded-2xl transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 p-2 md:p-3">
          {(() => {
            const primaryUrl = imageUrl || (product as any)?.image1 || (product as any)?.images?.[0]
            const secondaryUrl = (product as any)?.images?.[1] || (product as any)?.image2 || null
            const primaryFade = secondaryUrl ? "transition-opacity group-hover:opacity-0" : ""
            return primaryUrl ? (
              <>
                <ProductImage
                  product={product}
                  imageUrl={primaryUrl}
                  className={`w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 ${primaryFade}`}
                  priority={priority}
                />
                {secondaryUrl && (
                  <ProductImage
                    product={product}
                    imageUrl={secondaryUrl}
                    className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 opacity-0 group-hover:opacity-100 p-3"
                    priority={false}
                  />
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <ShoppingBag className="h-16 w-16 md:h-20 md:w-20" />
                </div>
              </div>
            )
          })()}

          <div className="absolute top-2 right-2 z-10">
            <FavoriteButton productId={product.id} />
          </div>
          {(product as any)?.liquidation && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-red-600 text-white shadow">Liquidación</span>
            </div>
          )}
          {(product as any)?.weeklyOffer && !((product as any)?.liquidation) && (
            <div className="absolute top-2 left-2 z-10">
              <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-amber-500 text-white shadow">Oferta semana</span>
            </div>
          )}
          {product.isInStock === false && (
            <div className="absolute bottom-2 left-2 z-10">
              <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-gray-900/80 text-white shadow">Sin stock</span>
            </div>
          )}
        </div>

        <CardContent className="p-3 flex-1 flex flex-col">
          <div className="flex-1">
            <h3 className="font-semibold text-[13px] mb-2 line-clamp-2 h-10 text-gray-900 dark:text-gray-100">{product.name}</h3>
          </div>

          <div className="mt-auto">
            <div className="mb-2">
              <p className={`price font-extrabold text-lg ${ (product as any)?.liquidation ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>{renderPrice()}</p>
              <p className="text-[11px] text-amber-600 mt-0.5">Gana {renderPoints()} pts</p>
            </div>

            <div className="flex gap-2 min-h-[2.5rem]">
              {showAddToCart && (
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  className="flex-1 w-full md:w-auto h-10 md:h-9 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm"
                  onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  onClick={handleAddToCart}
                  disabled={product.isInStock === false}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  <span className="text-sm">Agregar</span>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
