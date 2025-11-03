"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { getOrder } from "@/services/api/orderService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Home, ShoppingBag, Check, Clock, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchExchangeRate } from "@/utils/currencyUtils"

export default function OrderConfirmationPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exchangeRate, setExchangeRate] = useState<number>(1100)
  const [estimatedPoints, setEstimatedPoints] = useState<number>(0)

  useEffect(() => {
    // Scroll al inicio de la página cuando se carga
    window.scrollTo(0, 0)

    const loadOrder = async () => {
      try {
        setLoading(true)
        const orderData = await getOrder(String(params.id))
        if (orderData) {
          setOrder(orderData)
          try {
            const pts = Array.isArray(orderData.items)
              ? orderData.items.reduce((acc: number, it: any) => {
                  const unit = Math.max(0, Math.round(Number(it.price || 0) * 100))
                  return acc + unit * Number(it.quantity || 1)
                }, 0)
              : 0
            setEstimatedPoints(pts)
          } catch {}
        } else {
          // Si no se encuentra la orden, redirigir a la página principal
          router.push("/gremio")
        }
      } catch (error) {
        console.error("Error al cargar la orden:", error)
        router.push("/gremio")
      } finally {
        setLoading(false)
      }
    }

    const getExchangeRate = async () => {
      try {
        const rate = await fetchExchangeRate()
        if (rate) {
          setExchangeRate(rate)
        }
      } catch (error) {
        console.error("Error al obtener la tasa de cambio:", error)
      }
    }

    loadOrder()
    getExchangeRate()
  }, [params.id, router])

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "entregado":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400">
            <Check className="mr-1 h-3 w-3" />
            Completado
          </Badge>
        )
      case "processing":
      case "procesando":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400">
            <Clock className="mr-1 h-3 w-3" />
            Procesando
          </Badge>
        )
      case "pending":
      case "pendiente":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400">
            <AlertTriangle className="mr-1 h-3 w-3" />
            Pendiente
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodName = (method: string) => {
    switch (method) {
      case "transfer":
        return "Transferencia Bancaria"
      case "usdt":
        return "USDT (Tether)"
      case "cod":
        return "Contra Entrega"
      default:
        return method
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  if (loading) {
    return (
      <div className="container px-4 py-8 md:px-6 md:py-12 max-w-5xl mx-auto">
        <div className="mb-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container px-4 py-8 md:px-6 md:py-12 max-w-5xl mx-auto">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Orden no encontrada</h2>
          <p className="text-muted-foreground mb-6">La orden que estás buscando no existe o ha sido eliminada.</p>
          <Button onClick={() => router.push("/gremio")}>
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12 max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
          <Check className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">¡Gracias por tu compra!</h1>
        <p className="text-muted-foreground">Tu pedido ha sido recibido y está siendo procesado.</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Resumen del Pedido</CardTitle>
          <CardDescription>
            Pedido #{params.id.substring(0, 8)} • {formatDate(order.date || order.createdAt?.toDate().toISOString())}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Estado del Pedido</h3>
              <div>{getStatusBadge(order.status)}</div>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Método de Pago</h3>
              <p>{getPaymentMethodName(order.paymentMethod)}</p>
            </div>
            <div>
              <h3 className="font-medium text-sm text-muted-foreground mb-1">Total</h3>
              <p className="font-medium">${order.totalAmount?.toFixed(2)} USD</p>
              <p className="text-sm text-muted-foreground">
                {new Intl.NumberFormat("es-AR").format(Math.round(order.totalAmount * exchangeRate))} ARS
              </p>
              <div className="mt-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Puntos a ganar</span>
                  <span className="font-semibold">{estimatedPoints.toLocaleString('es-AR')} pts</span>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Productos</h3>
              <div className="space-y-4">
                {order.items &&
                  order.items.map((item: any, index: number) => (
                    <div key={index} className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-2xl text-gray-400">📦</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm">{item.name}</h4>
                          <p className="text-xs text-muted-foreground">Cantidad: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-medium">${(item.price * item.quantity).toFixed(2)} USD</p>
                    </div>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium mb-2">Dirección de Envío</h3>
                {order.shippingAddress ? (
                  <div className="text-sm">
                    <p className="font-medium">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.street}</p>
                    <p>
                      {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                    </p>
                    <p>{order.shippingAddress.country}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay información de envío disponible</p>
                )}
              </div>

              <div>
                <h3 className="font-medium mb-2">Información del Destinatario</h3>
                {order.recipientInfo ? (
                  <div className="text-sm">
                    <p>
                      <span className="text-muted-foreground">Nombre:</span> {order.recipientInfo.name}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Documento:</span> {order.recipientInfo.documentId}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Teléfono:</span> {order.recipientInfo.phone}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No hay información del destinatario disponible</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Recibirás un correo electrónico con los detalles de tu pedido y actualizaciones sobre el estado del envío.
          </p>
          <p className="text-xs text-center text-amber-600">
            Los puntos se acreditarán cuando el pago esté confirmado. Podrás verlos en tu perfil del gremio.
          </p>
        </CardFooter>
      </Card>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={() => router.push("/")} variant="outline" className="flex items-center">
          <Home className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>
        <Button
          onClick={() => router.push("/gremio/orders")}
          className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600"
        >
          <ShoppingBag className="mr-2 h-4 w-4" />
          Ver mis pedidos
        </Button>
      </div>
    </div>
  )
}
