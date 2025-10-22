"use client"

import { useEffect } from "react"
import { useCart } from "@/context/CartContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag, LogIn } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useCurrency } from "@/context/CurrencyContext"
import { fetchExchangeRate } from "@/utils/currencyUtils"
import { useState } from "react"

export default function CartPage() {
  const pathname = usePathname()
  const inGremio = pathname?.startsWith("/gremio")
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart()
  const { user } = useAuth()
  const { currency } = useCurrency()
  const [exchangeRate, setExchangeRate] = useState(1100)

  // Cargar la tasa de cambio desde Firebase
  useEffect(() => {
    const getExchangeRate = async () => {
      try {
        const rate = await fetchExchangeRate()
        if (rate) setExchangeRate(rate)
      } catch (error) {
        console.error("Error al obtener la tasa de cambio:", error)
      }
    }
    getExchangeRate()
  }, [])

  // Forzar scroll al inicio cuando se carga la página
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12 max-w-7xl mx-auto">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent">
          Carrito de Compra
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">Revisa tus artículos y procede al pago</p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="rounded-xl border shadow-sm bg-white dark:bg-gray-800/50 overflow-hidden transition-all hover:shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <ShoppingBag className="h-5 w-5 mr-2 text-red-600" />
                  Artículos ({items.reduce((count, item) => count + item.quantity, 0)})
                </h2>
                <div className="divide-y">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex py-6 group">
                      <div className="h-28 w-28 flex-shrink-0 overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-700 transition-all group-hover:shadow-md">
                        <img
                          src={
                            item.product.image1 ||
                            (item.product.images && item.product.images.length > 0
                              ? item.product.images[0]
                              : `/placeholder.svg?height=100&width=100`)
                          }
                          alt={item.product.name}
                          className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="ml-6 flex flex-1 flex-col">
                        <div className="flex justify-between text-base font-medium">
                          <h3 className="text-lg font-medium group-hover:text-red-600 transition-colors">
                            {item.product.name}
                          </h3>
                          <p className="ml-4 font-semibold text-red-600">
                            {currency === "ARS"
                              ? `${new Intl.NumberFormat("es-AR").format(Math.round(item.product.price * item.quantity * exchangeRate))} ARS`
                              : `${(item.product.price * item.quantity).toFixed(2)} USD`}
                          </p>
                        </div>
                        <div className="flex flex-1 items-end justify-between text-sm mt-4">
                          <div className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 rounded-full p-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                              <span className="sr-only">Disminuir cantidad</span>
                            </Button>
                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900"
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                              <span className="sr-only">Aumentar cantidad</span>
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30 transition-all"
                            onClick={() => removeItem(item.product.id)}
                          >
                            <Trash2 className="mr-1 h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border p-6 shadow-sm bg-white dark:bg-gray-800/50 transition-all hover:shadow-md">
              <h2 className="text-xl font-semibold flex items-center">
                <span className="mr-2">🎁</span>
                ¿Tienes un cupón?
              </h2>
              <div className="mt-4 flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                <Input placeholder="Introduce código de cupón" className="max-w-xs" />
                <Button
                  variant="outline"
                  className="border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </div>

          <div>
            <div className="rounded-xl border shadow-sm bg-white dark:bg-gray-800/50 sticky top-24 transition-all hover:shadow-md">
              <div className="p-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <span className="mr-2">📋</span>
                  Resumen del Pedido
                </h2>
                <div className="mt-6 space-y-4">
                  <div className="flex justify-between text-sm">
                    <p className="text-gray-500 dark:text-gray-400">Subtotal</p>
                    <p className="font-medium">
                      {currency === "ARS"
                        ? `${new Intl.NumberFormat("es-AR").format(Math.round(totalPrice * exchangeRate))} ARS`
                        : `${totalPrice.toFixed(2)} USD`}
                    </p>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-medium">
                      <p>Total</p>
                      <p className="text-xl font-bold text-red-600">
                        {currency === "ARS"
                          ? `${new Intl.NumberFormat("es-AR").format(Math.round(totalPrice * exchangeRate))} ARS`
                          : `${totalPrice.toFixed(2)} USD`}
                      </p>
                    </div>
                  </div>
                </div>
                {user ? (
                  <Button
                    className="mt-6 w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
                    asChild
                  >
                    <Link href={inGremio ? "/gremio/checkout" : "/checkout"} className="flex items-center justify-center">
                      Proceder al Pago
                      <ArrowRight className="ml-2 h-4 w-4 animate-pulse" />
                    </Link>
                  </Button>
                ) : (
                  <div className="mt-6 space-y-3">
                    <Button
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg"
                      asChild
                    >
                      <Link href={inGremio ? "/auth/login?redirect=/gremio/cart" : "/auth/login?redirect=/cart"} className="flex items-center justify-center">
                        Iniciar Sesión para Comprar
                        <LogIn className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Inicia sesión o regístrate para completar tu compra
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6">
              <Button
                variant="outline"
                className="w-full border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-800 dark:hover:bg-red-900/30 transition-all"
                asChild
              >
                <Link href={inGremio ? "/gremio" : "/products"} className="flex items-center justify-center">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Continuar Comprando
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center space-y-6 rounded-xl border py-16 bg-white dark:bg-gray-800/50 shadow-sm">
          <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full">
            <ShoppingBag className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold">Tu carrito está vacío</h2>
          <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
            Parece que aún no has añadido ningún artículo a tu carrito. Explora nuestros productos y encuentra lo que
            necesitas.
          </p>
          <Button
            asChild
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all shadow-md hover:shadow-lg mt-4"
          >
            <Link href={inGremio ? "/gremio" : "/search"} className="flex items-center">
              <ShoppingBag className="mr-2 h-4 w-4" />
              Ver Productos
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}
