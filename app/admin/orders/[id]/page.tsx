"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getOrder } from "@/services/api/orderService"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Printer, Download, Check, X, Clock, AlertTriangle } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchExchangeRate } from "@/utils/currencyUtils"

export default function OrderDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [exchangeRate, setExchangeRate] = useState<number>(1100)

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true)
        const orderData = await getOrder(params.id)
        if (orderData) {
          setOrder(orderData)
        } else {
          // Si no se encuentra la orden, redirigir a la lista de órdenes
          router.push("/admin/orders")
        }
      } catch (error) {
        console.error("Error al cargar la orden:", error)
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
      case "cancelled":
      case "cancelado":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400">
            <X className="mr-1 h-3 w-3" />
            Cancelado
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
          <Button onClick={() => router.push("/admin/orders")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a órdenes
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12 max-w-5xl mx-auto">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <div className="flex items-center mb-2">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4 hover:scale-105 transition-transform">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Orden #{params.id.substring(0, 8)}</h1>
          </div>
          <p className="text-muted-foreground">
            Realizada el {formatDate(order.date || order.createdAt?.toDate().toISOString())}
          </p>
        </div>
        <div className="flex gap-2 mt-4 sm:mt-0">
          <Button variant="outline" className="flex items-center">
            <Printer className="mr-2 h-4 w-4" />
            Imprimir
          </Button>
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Orden</CardTitle>
              <CardDescription>Información general sobre esta orden</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Estado</h3>
                  <div>{getStatusBadge(order.status)}</div>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Cliente</h3>
                  <p>{order.customer || order.recipientInfo?.name || "Cliente no especificado"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Email</h3>
                  <p>{order.email || order.userEmail || "No disponible"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Teléfono</h3>
                  <p>{order.recipientInfo?.phone || "No disponible"}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Método de pago</h3>
                  <p>{getPaymentMethodName(order.paymentMethod)}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Estado del pago</h3>
                  <p>
                    {order.paymentStatus === "pending_verification"
                      ? "Pendiente de verificación"
                      : order.paymentStatus === "completed"
                        ? "Completado"
                        : order.paymentStatus === "pending"
                          ? "Pendiente"
                          : order.paymentStatus || "No disponible"}
                  </p>
                </div>
              </div>

              {order.notes && (
                <div className="mt-6">
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Notas</h3>
                  <p className="p-3 bg-muted rounded-md text-sm">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <CardDescription>Artículos incluidos en esta orden</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items &&
                  order.items.map((item, index) => (
                    <div key={index} className="flex items-start justify-between py-2">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image || "/placeholder.svg"}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-3xl text-gray-400">📦</div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">Cantidad: {item.quantity}</p>
                          {item.options && Object.keys(item.options).length > 0 && (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {Object.entries(item.options).map(([key, value]) => (
                                <span key={key} className="mr-2">
                                  {key}: {value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${item.price.toFixed(2)} USD</p>
                        <p className="text-sm text-muted-foreground">${(item.price * item.quantity).toFixed(2)} USD</p>
                        <p className="text-xs text-muted-foreground">
                          {new Intl.NumberFormat("es-AR").format(Math.round(item.price * item.quantity * exchangeRate))}{" "}
                          ARS
                        </p>
                      </div>
                    </div>
                  ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <p>Subtotal</p>
                  <p>${order.totalAmount?.toFixed(2)} USD</p>
                </div>
                <div className="flex justify-between text-sm">
                  <p>Envío</p>
                  <p>Gratis</p>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-medium">
                  <p>Total</p>
                  <div className="text-right">
                    <p>${order.totalAmount?.toFixed(2)} USD</p>
                    <p className="text-sm text-muted-foreground">
                      {new Intl.NumberFormat("es-AR").format(Math.round(order.totalAmount * exchangeRate))} ARS
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Dirección de Envío</CardTitle>
              <CardDescription>Ubicación de entrega</CardDescription>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div>
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                </div>
              ) : (
                <p className="text-muted-foreground">No hay información de envío disponible</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Información del Destinatario</CardTitle>
              <CardDescription>Datos de contacto</CardDescription>
            </CardHeader>
            <CardContent>
              {order.recipientInfo ? (
                <div>
                  <div className="mb-2">
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Nombre</h3>
                    <p>{order.recipientInfo.name}</p>
                  </div>
                  <div className="mb-2">
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Documento</h3>
                    <p>{order.recipientInfo.documentId}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Teléfono</h3>
                    <p>{order.recipientInfo.phone}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No hay información del destinatario disponible</p>
              )}
            </CardContent>
          </Card>

          {order.paymentMethod === "transfer" && order.transferDetails && (
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Transferencia</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{order.transferDetails}</p>
              </CardContent>
            </Card>
          )}

          {order.paymentMethod === "usdt" && order.transactionHash && (
            <Card>
              <CardHeader>
                <CardTitle>Detalles de la Transacción USDT</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <h3 className="font-medium text-sm text-muted-foreground mb-1">Hash de Transacción</h3>
                  <p className="text-sm break-all">{order.transactionHash}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => router.push("/admin/orders")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a órdenes
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" className="text-red-600 hover:bg-red-50 hover:text-red-700">
            <X className="mr-2 h-4 w-4" />
            Cancelar orden
          </Button>
          <Button className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600">
            <Check className="mr-2 h-4 w-4" />
            Marcar como completada
          </Button>
        </div>
      </div>
    </div>
  )
}
