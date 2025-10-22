"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Package, CheckCircle, Truck, Eye, Clock, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  collection,
  query,
  where,
  orderBy,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { createPortal } from "react-dom"

interface Sale {
  id: string
  saleNumber: string
  date: string
  time: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  subtotal: number
  total: number
  currency: string
  status: "pending" | "paid" | "delivered"
  createdAt: any
  paidAt?: any
  deliveredAt?: any
  paymentDetails?: any
  isService?: boolean
}

interface SaleDetailsModalProps {
  sale: Sale
  onClose: () => void
  onMarkAsDelivered?: (saleId: string) => void
}

const SaleDetailsModal = ({ sale, onClose, onMarkAsDelivered }: SaleDetailsModalProps) => {
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") return `$${amount.toFixed(2)} USD`
    return `$${amount.toLocaleString()} ARS`
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999999,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999999 }}>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Detalles del Ticket - {sale.saleNumber}
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Sale Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Venta:</label>
                <p className="font-semibold">
                  {sale.date} - {sale.time}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha de Pago:</label>
                <p className="font-semibold">
                  {sale.paidAt ? new Date(sale.paidAt.seconds * 1000).toLocaleString("es-AR") : "No registrado"}
                </p>
              </div>
              {sale.deliveredAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Fecha de Entrega:</label>
                  <p className="font-semibold">{new Date(sale.deliveredAt.seconds * 1000).toLocaleString("es-AR")}</p>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Estado:</label>
                <div className="mt-1">
                  <Badge variant={sale.status === "delivered" ? "default" : "secondary"}>
                    {sale.status === "delivered" ? "Entregado" : "Listo para entrega"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Total:</label>
                <p className="font-bold text-xl">{formatCurrency(sale.total, sale.currency)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Cantidad Total:</label>
                <p className="font-bold text-lg">{sale.items.reduce((sum, item) => sum + item.quantity, 0)} unidades</p>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div>
            <h3 className="font-semibold mb-3">Lista de Productos para Entregar:</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-bold">
                          {item.quantity}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(item.price, sale.currency)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.subtotal, sale.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>{formatCurrency(sale.total, sale.currency)}</span>
            </div>
          </div>

          {sale.status === "paid" && onMarkAsDelivered && (
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Cerrar
              </Button>
              <Button onClick={() => onMarkAsDelivered(sale.id)} className="bg-green-600 hover:bg-green-700">
                <Truck className="h-4 w-4 mr-2" />
                Marcar como Entregado
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )

  // Usar createPortal para renderizar fuera del contexto actual
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}

export default function DepositoPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [activeTab, setActiveTab] = useState("ready")
  const { toast } = useToast()

  // Load paid sales from Firebase
  useEffect(() => {
    const salesRef = collection(db, "sales")
    const q = query(salesRef, where("status", "in", ["paid", "delivered"]), orderBy("paidAt", "desc"))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData = snapshot.docs
        .map((doc) => {
          const data = doc.data()
          return {
            id: doc.id,
            saleNumber: data.saleNumber || `SALE-${doc.id.substring(0, 8).toUpperCase()}`,
            date: data.date || new Date().toLocaleDateString("es-AR"),
            time: data.time || new Date().toLocaleTimeString("es-AR"),
            items: data.items || [],
            subtotal: data.subtotal || 0,
            total: data.total || 0,
            currency: data.currency || "USD",
            status: data.status || "paid",
            createdAt: data.createdAt,
            paidAt: data.paidAt,
            deliveredAt: data.deliveredAt,
            paymentDetails: data.paymentDetails,
            isService: data.isService || false,
          } as Sale
        })
        .filter((sale) => !sale.isService) // Filter out technical services

      setSales(salesData)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  // Filter sales based on search term and active tab
  useEffect(() => {
    let filtered = sales

    // Filter by status
    if (activeTab === "ready") {
      filtered = sales.filter((sale) => sale.status === "paid")
    } else if (activeTab === "delivered") {
      filtered = sales.filter((sale) => sale.status === "delivered")
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (sale) =>
          sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.date.includes(searchTerm) ||
          sale.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredSales(filtered)
  }, [searchTerm, sales, activeTab])

  // Mark as delivered
  const markAsDelivered = async (saleId: string) => {
    try {
      const saleRef = doc(db, "sales", saleId)
      await updateDoc(saleRef, {
        status: "delivered",
        deliveredAt: serverTimestamp(),
      })

      toast({
        title: "Producto entregado",
        description: "El ticket ha sido marcado como entregado exitosamente",
      })

      setSelectedSale(null)
    } catch (error) {
      console.error("Error marking as delivered:", error)
      toast({
        title: "Error",
        description: "No se pudo marcar como entregado",
        variant: "destructive",
      })
    }
  }

  // Delete sale
  const deleteSale = async (saleId: string, saleNumber: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el ticket ${saleNumber}?`)) {
      return
    }

    try {
      await deleteDoc(doc(db, "sales", saleId))

      toast({
        title: "Ticket eliminado",
        description: `El ticket ${saleNumber} ha sido eliminado exitosamente`,
      })
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el ticket",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") return `$${amount.toFixed(2)} USD`
    return `$${amount.toLocaleString()} ARS`
  }

  const readyForDelivery = sales.filter((s) => s.status === "paid" && !s.isService)
  const deliveredSales = sales.filter((s) => s.status === "delivered" && !s.isService)

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Package className="h-8 w-8 text-blue-600" />
              </div>
              Gestión de Depósito
            </h1>
            <p className="text-gray-600 mt-2">Control de entregas y productos listos para despacho</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{readyForDelivery.length}</div>
              <div className="text-sm text-gray-500">Listos para entrega</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{deliveredSales.length}</div>
              <div className="text-sm text-gray-500">Entregados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
              </div>
              <div className="text-sm text-gray-500">Total productos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por número de ticket, fecha o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ready" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Listos para Entrega ({readyForDelivery.length})
          </TabsTrigger>
          <TabsTrigger value="delivered" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Entregados ({deliveredSales.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Package className="h-5 w-5" />
                Productos Listos para Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-gray-500 text-lg">No hay productos listos para entrega</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Los productos aparecerán aquí una vez que sean pagados en caja
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Ticket</TableHead>
                        <TableHead className="font-semibold">Fecha de Pago</TableHead>
                        <TableHead className="font-semibold">Productos</TableHead>
                        <TableHead className="font-semibold">Cantidad Total</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono font-medium">{sale.saleNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.date}</div>
                              <div className="text-sm text-gray-500">{sale.time}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-[250px]">
                              {sale.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="truncate">
                                  <span className="font-medium">{item.quantity}x</span> {item.name}
                                </div>
                              ))}
                              {sale.items.length > 2 && (
                                <div className="text-gray-500">+{sale.items.length - 2} productos más</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-bold text-lg">
                                {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                              </div>
                              <div className="text-xs text-gray-500">unidades</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">{formatCurrency(sale.total, sale.currency)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800">Listo para entrega</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSale(sale)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => markAsDelivered(sale.id)}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                              >
                                <Truck className="h-4 w-4" />
                                Entregar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteSale(sale.id, sale.saleNumber)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="delivered" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Productos Entregados
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-30 text-green-500" />
                  <p className="text-gray-500 text-lg">No hay productos entregados</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Ticket</TableHead>
                        <TableHead className="font-semibold">Fecha de Entrega</TableHead>
                        <TableHead className="font-semibold">Productos</TableHead>
                        <TableHead className="font-semibold">Cantidad</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono font-medium">{sale.saleNumber}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.date}</div>
                              <div className="text-sm text-gray-500">
                                {sale.deliveredAt
                                  ? new Date(sale.deliveredAt.seconds * 1000).toLocaleString("es-AR")
                                  : "No registrado"}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-[250px]">
                              {sale.items.slice(0, 2).map((item, idx) => (
                                <div key={idx} className="truncate">
                                  <span className="font-medium">{item.quantity}x</span> {item.name}
                                </div>
                              ))}
                              {sale.items.length > 2 && (
                                <div className="text-gray-500">+{sale.items.length - 2} productos más</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-center">
                              <div className="font-bold text-lg">
                                {sale.items.reduce((sum, item) => sum + item.quantity, 0)}
                              </div>
                              <div className="text-xs text-gray-500">unidades</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold">{formatCurrency(sale.total, sale.currency)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Entregado</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSale(sale)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                Ver Detalles
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteSale(sale.id, sale.saleNumber)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sale Details Modal */}
      {selectedSale && (
        <SaleDetailsModal
          sale={selectedSale}
          onClose={() => setSelectedSale(null)}
          onMarkAsDelivered={selectedSale.status === "paid" ? markAsDelivered : undefined}
        />
      )}
    </div>
  )
}
