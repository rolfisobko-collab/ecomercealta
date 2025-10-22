"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ShoppingCart,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Download,
  Calendar,
  Loader2,
  CheckCircle,
  Truck,
  AlertTriangle,
  Clock,
  Package,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { collection, getDocs, query, orderBy, where, doc, updateDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface OrderItem {
  productId: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

interface StatusUpdate {
  status: string
  timestamp: any
  note: string
}

interface RecipientInfo {
  name: string
  documentId: string
  phone: string
}

interface ShippingAddress {
  id: string
  name: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

interface Order {
  id: string
  userId: string
  userEmail?: string
  customer: string
  email: string
  date: string
  status: string
  paymentStatus: string
  paymentMethod: string
  total: number
  items: OrderItem[]
  createdAt: Date
  notes?: string
  addressId?: string
  shippingAddress?: ShippingAddress
  recipientInfo?: RecipientInfo
  transferDetails?: string | any
  transactionHash?: string | any
  statusHistory?: StatusUpdate[]
}

export default function AdminOrders() {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [statusNote, setStatusNote] = useState("")
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  const itemsPerPage = 10

  // Cargar datos reales de Firestore
  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true)
        const ordersRef = collection(db, "orders")
        let q = query(ordersRef, orderBy("createdAt", "desc"))

        if (statusFilter !== "all") {
          q = query(ordersRef, where("status", "==", statusFilter), orderBy("createdAt", "desc"))
        }

        const querySnapshot = await getDocs(q)
        const ordersData = querySnapshot.docs.map((doc) => {
          const data = doc.data()

          // Procesar transferDetails y transactionHash para asegurar que sean strings
          let transferDetailsStr = ""
          if (data.transferDetails) {
            if (typeof data.transferDetails === "string") {
              transferDetailsStr = data.transferDetails
            } else if (typeof data.transferDetails === "object") {
              // Si es un objeto, convertirlo a string o extraer un valor específico
              transferDetailsStr = "Detalles disponibles"
            }
          }

          let transactionHashStr = ""
          if (data.transactionHash) {
            if (typeof data.transactionHash === "string") {
              transactionHashStr = data.transactionHash
            } else if (typeof data.transactionHash === "object") {
              // Si es un objeto, convertirlo a string o extraer un valor específico
              transactionHashStr = "Hash disponible"
            }
          }

          // Obtener información del destinatario
          const recipientInfo = data.recipientInfo || {
            name: data.customer || "No disponible",
            documentId: "No disponible",
            phone: "No disponible",
          }

          // Obtener información de la dirección de envío
          const shippingAddress = data.shippingAddress || {
            id: data.addressId || "",
            name: "No disponible",
            street: "No disponible",
            city: "No disponible",
            state: "No disponible",
            zipCode: "No disponible",
            country: "Argentina",
          }

          return {
            id: doc.id,
            userId: data.userId || "",
            userEmail: data.userEmail || data.email || "",
            customer: recipientInfo.name || data.customer || "Cliente",
            email: data.email || data.userEmail || "No disponible",
            date: data.createdAt?.toDate().toLocaleDateString("es-AR") || new Date().toLocaleDateString("es-AR"),
            status: data.status || "pending",
            paymentStatus: data.paymentStatus || "pending",
            paymentMethod: data.paymentMethod || "N/A",
            total: data.totalAmount || 0,
            items: Array.isArray(data.items) ? data.items : [],
            createdAt: data.createdAt?.toDate() || new Date(),
            notes: typeof data.notes === "string" ? data.notes : "",
            addressId: typeof data.addressId === "string" ? data.addressId : "",
            shippingAddress: shippingAddress,
            recipientInfo: recipientInfo,
            transferDetails: transferDetailsStr,
            transactionHash: transactionHashStr,
            statusHistory: Array.isArray(data.statusHistory) ? data.statusHistory : [],
          }
        })

        setOrders(ordersData)
      } catch (error) {
        console.error("Error fetching orders:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los pedidos",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [statusFilter, toast])

  // Filtrar pedidos por término de búsqueda
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.recipientInfo?.documentId &&
        order.recipientInfo.documentId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.recipientInfo?.phone && order.recipientInfo.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.shippingAddress?.street && order.shippingAddress.street.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  // Ordenar pedidos
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (!sortField) return 0

    let valueA, valueB

    switch (sortField) {
      case "id":
        valueA = a.id.toLowerCase()
        valueB = b.id.toLowerCase()
        break
      case "customer":
        valueA = (a.customer || "").toLowerCase()
        valueB = (b.customer || "").toLowerCase()
        break
      case "date":
        valueA = new Date(a.date).getTime()
        valueB = new Date(b.date).getTime()
        break
      case "status":
        valueA = (a.status || "").toLowerCase()
        valueB = (b.status || "").toLowerCase()
        break
      case "total":
        valueA = a.total || 0
        valueB = b.total || 0
        break
      default:
        return 0
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Paginación
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedOrders = sortedOrders.slice(startIndex, startIndex + itemsPerPage)

  // Función para cambiar el ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Función para obtener el color de la insignia según el estado
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400"
      case "processing":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "shipped":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400"
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
    }
  }

  // Función para obtener el texto del estado en español
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return "Entregado"
      case "pending":
        return "Pendiente"
      case "processing":
        return "Procesando"
      case "shipped":
        return "Enviado"
      case "cancelled":
        return "Cancelado"
      default:
        return status
    }
  }

  // Función para obtener el icono del estado
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
      case "delivered":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "processing":
        return <Package className="h-4 w-4 text-blue-500" />
      case "shipped":
        return <Truck className="h-4 w-4 text-purple-500" />
      case "cancelled":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  // Función para obtener el texto del método de pago en español
  const getPaymentMethodText = (method: string) => {
    if (!method) return "No especificado"

    switch (method) {
      case "transfer":
        return "Transferencia"
      case "usdt":
        return "USDT"
      case "cod":
        return "Contra entrega"
      default:
        return typeof method === "string" ? method : "No especificado"
    }
  }

  // Función para obtener el texto del estado de pago en español
  const getPaymentStatusText = (status: string) => {
    if (!status) return "No especificado"

    switch (status) {
      case "paid":
        return "Pagado"
      case "pending":
        return "Pendiente"
      case "pending_verification":
        return "Verificando"
      case "failed":
        return "Fallido"
      case "refunded":
        return "Reembolsado"
      default:
        return typeof status === "string" ? status : "No especificado"
    }
  }

  // Función para abrir el diálogo de actualización de estado
  const openUpdateDialog = (order: Order) => {
    setSelectedOrder(order)
    setNewStatus(order.status)
    setStatusNote("")
    setIsUpdateDialogOpen(true)
  }

  // Función para abrir el diálogo de detalles del pedido
  const openViewDialog = (order: Order) => {
    setSelectedOrder(order)
    setIsViewDialogOpen(true)
  }

  // Función para actualizar el estado de un pedido
  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return

    try {
      setUpdatingStatus(true)
      const orderRef = doc(db, "orders", selectedOrder.id)

      // Crear historial de estados
      const statusUpdate = {
        status: newStatus,
        timestamp: Timestamp.now(),
        note: statusNote || `Estado actualizado a ${getStatusText(newStatus)}`,
      }

      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: Timestamp.now(),
        statusHistory: selectedOrder.statusHistory ? [...selectedOrder.statusHistory, statusUpdate] : [statusUpdate],
      })

      // Actualizar la lista de pedidos
      setOrders(orders.map((order) => (order.id === selectedOrder.id ? { ...order, status: newStatus } : order)))

      toast({
        title: "Estado actualizado",
        description: `El pedido #${selectedOrder.id.substring(0, 8)} ha sido actualizado a ${getStatusText(newStatus)}`,
      })

      setIsUpdateDialogOpen(false)
    } catch (error) {
      console.error("Error updating order status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      })
    } finally {
      setUpdatingStatus(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Gestión de Pedidos</h1>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Filter className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile toggle */}
          <div className="sm:hidden mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Filtros</span>
            <Button size="sm" variant="outline" onClick={() => setShowFiltersMobile(v => !v)}>
              {showFiltersMobile ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
          <div className={`flex flex-col sm:flex-row gap-4 ${showFiltersMobile ? '' : 'hidden'} sm:flex`}>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID, cliente, documento, teléfono o dirección..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Resetear a la primera página al buscar
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                setCurrentPage(1) // Resetear a la primera página al cambiar el filtro
              }}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="shipped">Enviado</SelectItem>
                <SelectItem value="delivered">Entregado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      onClick={() => handleSort("id")}
                      className="flex items-center hover:text-red-600 dark:hover:text-red-400"
                    >
                      ID
                      {sortField === "id" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("customer")}
                      className="flex items-center hover:text-red-600 dark:hover:text-red-400"
                    >
                      Cliente
                      {sortField === "customer" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <button
                      onClick={() => handleSort("date")}
                      className="flex items-center hover:text-red-600 dark:hover:text-red-400"
                    >
                      Fecha
                      {sortField === "date" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("status")}
                      className="flex items-center hover:text-red-600 dark:hover:text-red-400"
                    >
                      Estado
                      {sortField === "status" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Pago</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <button
                      onClick={() => handleSort("total")}
                      className="flex items-center hover:text-red-600 dark:hover:text-red-400"
                    >
                      Total
                      {sortField === "total" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                    </button>
                  </TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Loader2 className="mx-auto h-12 w-12 text-red-600 animate-spin mb-3" />
                      <p className="text-gray-500">Cargando pedidos...</p>
                    </TableCell>
                  </TableRow>
                ) : paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <ShoppingCart className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                      <p className="text-gray-500">No se encontraron pedidos</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{order.customer || "Cliente sin nombre"}</div>
                          <div className="text-xs text-gray-500">{order.recipientInfo?.documentId || "Sin DNI"}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex items-center">
                          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                          {order.date}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(order.status)}
                          <Badge className={getStatusBadgeVariant(order.status)}>{getStatusText(order.status)}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <div>{getPaymentMethodText(order.paymentMethod)}</div>
                          <div className="text-xs text-gray-500">{getPaymentStatusText(order.paymentStatus)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div>
                          <div className="font-medium">${order.total.toFixed(2)}</div>
                          <div className="text-sm text-gray-500">{order.items?.length || 0} productos</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="lucide lucide-more-vertical"
                              >
                                <circle cx="12" cy="12" r="1" />
                                <circle cx="12" cy="5" r="1" />
                                <circle cx="12" cy="19" r="1" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewDialog(order)} className="flex items-center">
                              <Eye className="mr-2 h-4 w-4" />
                              <span>Ver detalles</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openUpdateDialog(order)} className="flex items-center">
                              <Package className="mr-2 h-4 w-4" />
                              <span>Actualizar estado</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center">
                              <Download className="mr-2 h-4 w-4" />
                              <span>Descargar factura</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-4 border-t">
              <div className="text-sm text-gray-500">
                Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredOrders.length)} de{" "}
                {filteredOrders.length} pedidos
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Diálogo para actualizar el estado del pedido */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Actualizar estado del pedido</DialogTitle>
            <DialogDescription>Cambia el estado del pedido #{selectedOrder?.id.substring(0, 8)}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Estado</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Selecciona un estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="processing">Procesando</SelectItem>
                  <SelectItem value="shipped">Enviado</SelectItem>
                  <SelectItem value="delivered">Entregado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="note">Nota (opcional)</Label>
              <Textarea
                id="note"
                placeholder="Añade una nota sobre este cambio de estado"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateOrderStatus} disabled={updatingStatus}>
              {updatingStatus ? "Actualizando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para ver detalles del pedido */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Detalles del Pedido #{selectedOrder?.id.substring(0, 8)}</DialogTitle>
            <DialogDescription>
              Realizado el {selectedOrder?.date} - Estado: {selectedOrder && getStatusText(selectedOrder.status)}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto pr-1">
            {selectedOrder && (
              <div className="space-y-6">
                {/* Información del cliente */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Información del Destinatario</h3>
                  <div className="bg-muted rounded-md p-3 space-y-1">
                    <p>
                      <strong>Nombre:</strong> {selectedOrder.recipientInfo?.name || selectedOrder.customer}
                    </p>
                    <p>
                      <strong>DNI:</strong> {selectedOrder.recipientInfo?.documentId || "No disponible"}
                    </p>
                    <p>
                      <strong>Teléfono:</strong> {selectedOrder.recipientInfo?.phone || "No disponible"}
                    </p>
                    <p>
                      <strong>Email:</strong> {selectedOrder.email || selectedOrder.userEmail || "No disponible"}
                    </p>
                  </div>
                </div>

                {/* Dirección de envío */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Dirección de Envío</h3>
                  <div className="bg-muted rounded-md p-3 space-y-1">
                    <p>
                      <strong>Nombre:</strong> {selectedOrder.shippingAddress?.name || "No disponible"}
                    </p>
                    <p>
                      <strong>Dirección:</strong> {selectedOrder.shippingAddress?.street || "No disponible"}
                    </p>
                    <p>
                      <strong>Ciudad:</strong> {selectedOrder.shippingAddress?.city || "No disponible"}
                    </p>
                    <p>
                      <strong>Provincia:</strong> {selectedOrder.shippingAddress?.state || "No disponible"}
                    </p>
                    <p>
                      <strong>Código Postal:</strong> {selectedOrder.shippingAddress?.zipCode || "No disponible"}
                    </p>
                    <p>
                      <strong>País:</strong> {selectedOrder.shippingAddress?.country || "Argentina"}
                    </p>
                  </div>
                </div>

                {/* Detalles del pago */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Detalles del Pago</h3>
                  <div className="bg-muted rounded-md p-3 space-y-1">
                    <p>
                      <strong>Método:</strong> {getPaymentMethodText(selectedOrder.paymentMethod)}
                    </p>
                    <p>
                      <strong>Estado:</strong> {getPaymentStatusText(selectedOrder.paymentStatus)}
                    </p>
                    {selectedOrder.transferDetails && (
                      <p>
                        <strong>Detalles de transferencia:</strong> {selectedOrder.transferDetails}
                      </p>
                    )}
                    {selectedOrder.transactionHash && (
                      <p>
                        <strong>Hash de transacción:</strong> {selectedOrder.transactionHash}
                      </p>
                    )}
                  </div>
                </div>

                {/* Productos */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Productos</h3>
                  <div className="bg-muted rounded-md p-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead>Precio</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead className="text-right">Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.name}</TableCell>
                            <TableCell>${item.price.toFixed(2)}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell className="text-right">${item.subtotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow>
                          <TableCell colSpan={3} className="text-right font-bold">
                            Total:
                          </TableCell>
                          <TableCell className="text-right font-bold">${selectedOrder.total.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Notas */}
                {selectedOrder.notes && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Notas del Cliente</h3>
                    <div className="bg-muted rounded-md p-3">
                      <p>{selectedOrder.notes}</p>
                    </div>
                  </div>
                )}

                {/* Historial de estados */}
                {selectedOrder.statusHistory && selectedOrder.statusHistory.length > 0 && (
                  <div>
                    <h3 className="text-lg font-medium mb-2">Historial de Estados</h3>
                    <div className="bg-muted rounded-md p-3">
                      <ul className="space-y-2">
                        {selectedOrder.statusHistory.map((update, index) => (
                          <li key={index} className="border-b pb-2 last:border-0 last:pb-0">
                            <div className="flex items-center">
                              {getStatusIcon(update.status)}
                              <span className="ml-2 font-medium">{getStatusText(update.status)}</span>
                              <span className="ml-auto text-sm text-gray-500">
                                {update.timestamp.toDate().toLocaleString()}
                              </span>
                            </div>
                            {update.note && <p className="text-sm mt-1">{update.note}</p>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0 pt-2">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false)
                if (selectedOrder) openUpdateDialog(selectedOrder)
              }}
            >
              Actualizar Estado
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
