"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Package, AlertTriangle } from "lucide-react"
import { onProductsUpdate } from "@/services/hybrid/productService"
import type { Product } from "@/models/Product"
import type { CashCartItem } from "./types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Save, X, Eye, EyeOff, RefreshCw } from "lucide-react"
import { useCategories } from "@/hooks/useCategories"
import { useToast } from "@/components/ui/use-toast"
import { doc, updateDoc, serverTimestamp, collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ProductSelectorProps {
  onAddToCart: (item: CashCartItem) => void
}

export function ProductSelector({ onAddToCart }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedQuantities, setSelectedQuantities] = useState<{ [productId: string]: number }>({})
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [newPrice, setNewPrice] = useState<number>(0)
  const [newCost, setNewCost] = useState<number>(0)
  const [isUpdating, setIsUpdating] = useState(false)
  const [stockCategories, setStockCategories] = useState<Record<string, string>>({})
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [showCost, setShowCost] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [productsPerPage] = useState(10)

  const { categories } = useCategories()
  const { toast } = useToast()

  // Configurar listener para actualizaciones INSTANTÁNEAS
  useEffect(() => {
    console.log("🎧 Setting up INSTANT product updates listener")

    const unsubscribe = onProductsUpdate((updatedProducts) => {
      console.log("⚡ INSTANT products update received:", updatedProducts.length)
      setProducts(updatedProducts)
      setIsLoading(false)

      // Aplicar filtro de búsqueda a los productos actualizados
      if (searchTerm.trim()) {
        const filtered = updatedProducts.filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.category.toLowerCase().includes(searchTerm.toLowerCase()),
        )
        setFilteredProducts(filtered)
      } else {
        setFilteredProducts(updatedProducts)
      }
    })

    return unsubscribe
  }, [searchTerm])

  // Filtrar productos cuando cambie el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredProducts(products)
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredProducts(filtered)
    }
  }, [searchTerm, products])

  // Cargar categorías de stockCategories
  useEffect(() => {
    const fetchStockCategories = async () => {
      try {
        setLoadingCategories(true)
        const categoriesMap: Record<string, string> = {}

        const querySnapshot = await getDocs(collection(db, "stockCategories"))
        querySnapshot.forEach((doc) => {
          const categoryData = doc.data()
          if (categoryData.name) {
            categoriesMap[doc.id] = categoryData.name
          }
        })

        setStockCategories(categoriesMap)
      } catch (error) {
        console.error("Error al cargar categorías:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchStockCategories()
  }, [])

  const handleAddToCart = (product: Product) => {
    const quantity = selectedQuantities[product.id] || 1

    if (quantity > product.quantity) {
      alert(`Solo hay ${product.quantity} unidades disponibles`)
      return
    }

    const cartItem: CashCartItem = {
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      description: product.name,
      price: product.price,
      currency: product.currency === "USD" ? "USD" : "PESO",
      quantity: quantity,
    }

    onAddToCart(cartItem)

    // Reset quantity
    setSelectedQuantities((prev) => ({
      ...prev,
      [product.id]: 1,
    }))
  }

  const handleQuantityChange = (productId: string, quantity: number) => {
    setSelectedQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, quantity),
    }))
  }

  // Función para iniciar la edición de precio
  const startEditingPrice = (product: Product) => {
    setEditingProductId(product.id)
    setNewPrice(Number(product.price) || 0)
    setNewCost(Number(product.cost) || 0)
    console.log(`Iniciando edición del producto ${product.id}`)
  }

  // Función para cancelar la edición
  const cancelEditing = () => {
    setEditingProductId(null)
  }

  // Función para guardar el nuevo precio
  const saveNewPrice = async (productId: string) => {
    if (isUpdating) return

    try {
      setIsUpdating(true)
      console.log(`⚡ INSTANT price update for ${productId}`)

      const priceToSave = Number(newPrice) || 0
      const costToSave = Number(newCost) || 0

      const productRef = doc(db, "stock", productId)
      const updateData = {
        price: priceToSave,
        cost: costToSave,
        updatedAt: serverTimestamp(),
      }

      await updateDoc(productRef, updateData)
      console.log(`✅ Price updated instantly for ${productId}`)

      setEditingProductId(null)

      toast({
        title: "Precio actualizado",
        description: "El precio del producto ha sido actualizado instantáneamente",
        duration: 2000,
      })
    } catch (error) {
      console.error("Error al actualizar el precio:", error)
      toast({
        title: "Error al guardar",
        description: "No se pudo actualizar el precio. Intente nuevamente.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Cargando productos...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Seleccionar Productos
          <Badge variant="secondary" className="ml-auto">
            {filteredProducts.length} productos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {/* Barra de búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCost(!showCost)}
            className="flex items-center gap-2"
          >
            {showCost ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            {showCost ? "Ocultar Costos" : "Mostrar Costos"}
          </Button>
        </div>

        {/* Lista de productos en tabla */}
        <div className="rounded-md border overflow-auto max-h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio (USD)</TableHead>
                {showCost && <TableHead>Costo (USD)</TableHead>}
                <TableHead>Stock</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading || loadingCategories ? (
                <TableRow>
                  <TableCell colSpan={showCost ? 7 : 6} className="text-center py-4">
                    <div className="flex justify-center items-center">
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Cargando datos...
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showCost ? 7 : 6} className="text-center py-4">
                    <Package className="mx-auto h-8 w-8 mb-2 opacity-20" />
                    <p>No se encontraron productos</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts
                  .filter((product) => selectedCategory === "all" || product.category === selectedCategory)
                  .slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage)
                  .map((product) => (
                    <TableRow key={product.id} className={product.quantity <= 0 ? "bg-red-50" : ""}>
                      <TableCell className="font-medium w-[250px] whitespace-normal break-words">
                        {product.name}
                      </TableCell>
                      <TableCell>{stockCategories[product.category] || "Sin categoría"}</TableCell>
                      <TableCell>
                        {editingProductId === product.id ? (
                          <div className="flex items-center">
                            <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                            <Input
                              type="number"
                              value={newPrice}
                              onChange={(e) => setNewPrice(Number(e.target.value))}
                              className="w-20 h-8"
                              min="0"
                              step="0.01"
                            />
                          </div>
                        ) : (
                          <span>${product.price}</span>
                        )}
                      </TableCell>
                      {showCost && (
                        <TableCell>
                          {editingProductId === product.id ? (
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                              <Input
                                type="number"
                                value={newCost}
                                onChange={(e) => setNewCost(Number(e.target.value))}
                                className="w-20 h-8"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          ) : (
                            <span>${product.cost}</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={
                              product.quantity <= 0
                                ? "text-red-600 font-medium"
                                : product.quantity <= 5
                                  ? "text-yellow-600 font-medium"
                                  : ""
                            }
                          >
                            {product.quantity}
                          </span>
                          {product.quantity <= 0 && (
                            <Badge variant="destructive" className="text-xs">
                              Sin Stock
                            </Badge>
                          )}
                          {product.quantity > 0 && product.quantity <= 5 && (
                            <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Poco
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.quantity > 0 && (
                          <Input
                            type="number"
                            min="1"
                            max={product.quantity}
                            value={selectedQuantities[product.id] || 1}
                            onChange={(e) => handleQuantityChange(product.id, Number.parseInt(e.target.value) || 1)}
                            className="w-16 h-8 text-center"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {editingProductId === product.id ? (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => saveNewPrice(product.id)}
                                disabled={isUpdating}
                                className="px-2 h-8"
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelEditing}
                                disabled={isUpdating}
                                className="px-2 h-8 bg-transparent"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {product.quantity > 0 && (
                                <Button size="sm" onClick={() => handleAddToCart(product)} className="px-3 h-8">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Agregar
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditingPrice(product)}
                                className="px-2 h-8"
                                title="Editar precio"
                              >
                                <DollarSign className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Paginación */}
        {!isLoading && !loadingCategories && filteredProducts.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Mostrando {Math.min(filteredProducts.length, productsPerPage)} de {filteredProducts.length} productos
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="text-sm font-medium">
                Página {currentPage} de {Math.ceil(filteredProducts.length / productsPerPage)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage >= Math.ceil(filteredProducts.length / productsPerPage)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
