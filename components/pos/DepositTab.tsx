"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Package, AlertTriangle, TrendingUp, TrendingDown, RotateCcw, Filter } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface InventoryItem {
  id: string
  name: string
  category: string
  stock: number
  minStock: number
  maxStock: number
  price: number
  location: string
}

interface StockMovement {
  id: string
  productId: string
  productName: string
  type: "entry" | "exit" | "adjustment"
  quantity: number
  reason: string
  timestamp: Date
}

// Mock inventory data
const mockInventory: InventoryItem[] = [
  {
    id: "1",
    name: "iPhone 14 Pro Max",
    category: "Smartphones",
    stock: 5,
    minStock: 3,
    maxStock: 20,
    price: 1200,
    location: "A1-01",
  },
  {
    id: "2",
    name: "Samsung Galaxy S23",
    category: "Smartphones",
    stock: 8,
    minStock: 5,
    maxStock: 25,
    price: 900,
    location: "A1-02",
  },
  {
    id: "3",
    name: "Funda iPhone 14",
    category: "Accesorios",
    stock: 2,
    minStock: 10,
    maxStock: 50,
    price: 25,
    location: "B2-15",
  },
  {
    id: "4",
    name: "Cargador USB-C",
    category: "Accesorios",
    stock: 30,
    minStock: 15,
    maxStock: 100,
    price: 15,
    location: "B3-08",
  },
  {
    id: "5",
    name: "Protector de Pantalla",
    category: "Accesorios",
    stock: 0,
    minStock: 20,
    maxStock: 200,
    price: 10,
    location: "B3-12",
  },
  {
    id: "6",
    name: "AirPods Pro",
    category: "Audio",
    stock: 12,
    minStock: 8,
    maxStock: 30,
    price: 250,
    location: "C1-05",
  },
]

export function DepositTab() {
  const [inventory, setInventory] = useState<InventoryItem[]>(mockInventory)
  const [movements, setMovements] = useState<StockMovement[]>([
    {
      id: "1",
      productId: "1",
      productName: "iPhone 14 Pro Max",
      type: "entry",
      quantity: 10,
      reason: "Compra a proveedor",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
    {
      id: "2",
      productId: "3",
      productName: "Funda iPhone 14",
      type: "exit",
      quantity: 8,
      reason: "Venta al cliente",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>(inventory)

  const [newMovement, setNewMovement] = useState({
    productId: "",
    type: "entry" as "entry" | "exit" | "adjustment",
    quantity: "",
    reason: "",
  })

  const { toast } = useToast()

  // Filter inventory
  useEffect(() => {
    const filtered = inventory.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.location.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "all" || item.category === categoryFilter

      let matchesStock = true
      if (stockFilter === "low") {
        matchesStock = item.stock <= item.minStock
      } else if (stockFilter === "out") {
        matchesStock = item.stock === 0
      } else if (stockFilter === "normal") {
        matchesStock = item.stock > item.minStock && item.stock < item.maxStock
      } else if (stockFilter === "high") {
        matchesStock = item.stock >= item.maxStock
      }

      return matchesSearch && matchesCategory && matchesStock
    })

    setFilteredInventory(filtered)
  }, [inventory, searchTerm, categoryFilter, stockFilter])

  // Get unique categories
  const categories = Array.from(new Set(inventory.map((item) => item.category)))

  // Get stock status
  const getStockStatus = (item: InventoryItem) => {
    if (item.stock === 0) return { status: "Sin Stock", color: "destructive" }
    if (item.stock <= item.minStock) return { status: "Stock Bajo", color: "secondary" }
    if (item.stock >= item.maxStock) return { status: "Stock Alto", color: "default" }
    return { status: "Normal", color: "outline" }
  }

  // Calculate inventory value
  const totalInventoryValue = inventory.reduce((total, item) => total + item.stock * item.price, 0)

  // Low stock items
  const lowStockItems = inventory.filter((item) => item.stock <= item.minStock)

  // Add stock movement
  const addStockMovement = () => {
    if (!newMovement.productId || !newMovement.quantity || !newMovement.reason) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    const quantity = Number.parseInt(newMovement.quantity)
    if (isNaN(quantity) || quantity <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "Por favor ingresa una cantidad válida",
        variant: "destructive",
      })
      return
    }

    const product = inventory.find((item) => item.id === newMovement.productId)
    if (!product) return

    // Update inventory
    setInventory(
      inventory.map((item) => {
        if (item.id === newMovement.productId) {
          let newStock = item.stock

          if (newMovement.type === "entry") {
            newStock += quantity
          } else if (newMovement.type === "exit") {
            newStock -= quantity
            if (newStock < 0) {
              toast({
                title: "Stock insuficiente",
                description: "No hay suficiente stock para esta salida",
                variant: "destructive",
              })
              return item
            }
          } else {
            // adjustment
            newStock = quantity
          }

          return { ...item, stock: newStock }
        }
        return item
      }),
    )

    // Add movement to history
    const movement: StockMovement = {
      id: Date.now().toString(),
      productId: newMovement.productId,
      productName: product.name,
      type: newMovement.type,
      quantity,
      reason: newMovement.reason,
      timestamp: new Date(),
    }

    setMovements([movement, ...movements])

    // Reset form
    setNewMovement({
      productId: "",
      type: "entry",
      quantity: "",
      reason: "",
    })

    toast({
      title: "Movimiento registrado",
      description: `${newMovement.type === "entry" ? "Entrada" : newMovement.type === "exit" ? "Salida" : "Ajuste"} registrado correctamente`,
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Inventory Section */}
      <div className="lg:col-span-2 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold">{inventory.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <div>
                  <p className="text-sm text-gray-600">Stock Bajo</p>
                  <p className="text-2xl font-bold text-orange-600">{lowStockItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">${totalInventoryValue.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={stockFilter} onValueChange={setStockFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado de stock" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="out">Sin Stock</SelectItem>
                  <SelectItem value="low">Stock Bajo</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">Stock Alto</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setStockFilter("all")
                }}
              >
                Limpiar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Inventory List */}
        <Card>
          <CardHeader>
            <CardTitle>Inventario ({filteredInventory.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item)
                return (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <Badge variant={stockStatus.color as any}>{stockStatus.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {item.category} • {item.location} • ${item.price}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>Stock: {item.stock}</span>
                        <span>Min: {item.minStock}</span>
                        <span>Max: {item.maxStock}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{item.stock}</p>
                      <p className="text-sm text-gray-600">unidades</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Section */}
      <div className="space-y-4">
        {/* New Stock Movement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Movimiento de Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={newMovement.productId}
                onValueChange={(value) => setNewMovement({ ...newMovement, productId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar producto" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} (Stock: {item.stock})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={newMovement.type}
                onValueChange={(value: "entry" | "exit" | "adjustment") =>
                  setNewMovement({ ...newMovement, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entry">Entrada</SelectItem>
                  <SelectItem value="exit">Salida</SelectItem>
                  <SelectItem value="adjustment">Ajuste</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Cantidad"
                value={newMovement.quantity}
                onChange={(e) => setNewMovement({ ...newMovement, quantity: e.target.value })}
              />

              <Textarea
                placeholder="Motivo del movimiento"
                value={newMovement.reason}
                onChange={(e) => setNewMovement({ ...newMovement, reason: e.target.value })}
              />

              <Button className="w-full" onClick={addStockMovement}>
                Registrar Movimiento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Movements */}
        <Card>
          <CardHeader>
            <CardTitle>Movimientos Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {movements.slice(0, 10).map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {movement.type === "entry" ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : movement.type === "exit" ? (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    ) : (
                      <RotateCcw className="h-4 w-4 text-blue-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{movement.productName}</p>
                      <p className="text-xs text-gray-600">{movement.reason}</p>
                      <p className="text-xs text-gray-500">{movement.timestamp.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${
                        movement.type === "entry"
                          ? "text-green-600"
                          : movement.type === "exit"
                            ? "text-red-600"
                            : "text-blue-600"
                      }`}
                    >
                      {movement.type === "entry" ? "+" : movement.type === "exit" ? "-" : "="}
                      {movement.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
