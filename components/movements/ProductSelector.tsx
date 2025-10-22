"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Product } from "@/models/Product"
import { productService } from "@/services/hybrid/productService"
import type { MovementItem } from "@/models/Movement"
import { Search, Plus } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

type ProductSelectorProps = {
  onSelect: (item: MovementItem) => void
}

export function ProductSelector({ onSelect }: ProductSelectorProps) {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [unitPrice, setUnitPrice] = useState(0)

  useEffect(() => {
    if (open) {
      loadProducts()
    }
  }, [open])

  useEffect(() => {
    if (products.length > 0) {
      filterProducts()
    }
  }, [products, searchTerm])

  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(selectedProduct.price)
    }
  }, [selectedProduct])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getAll()
      setProducts(data)
    } catch (error) {
      console.error("Error loading products:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts(products)
      return
    }

    const term = searchTerm.toLowerCase()
    const filtered = products.filter(
      (product) => product.name.toLowerCase().includes(term) || product.category.toLowerCase().includes(term),
    )
    setFilteredProducts(filtered)
  }

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setUnitPrice(product.price)
    setQuantity(1)
  }

  const handleAddItem = () => {
    if (!selectedProduct) return

    const totalPrice = quantity * unitPrice

    onSelect({
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      unitPrice,
      totalPrice,
    })

    setOpen(false)
    setSelectedProduct(null)
    setQuantity(1)
    setUnitPrice(0)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Agregar Producto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar Producto</DialogTitle>
          <DialogDescription>Busca y selecciona un producto para agregar al movimiento</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Buscar productos..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`p-3 border rounded-md cursor-pointer transition-colors ${
                    selectedProduct?.id === product.id ? "border-primary bg-primary/10" : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="flex items-center gap-3">
                    {product.image1 ? (
                      <img
                        src={product.image1 || "/placeholder.svg"}
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded-md"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                        Sin imagen
                      </div>
                    )}
                    <div>
                      <h3 className="font-medium text-sm">{product.name}</h3>
                      <p className="text-sm text-gray-500">
                        Stock: {product.quantity} | Precio: ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredProducts.length === 0 && (
                <div className="col-span-2 text-center p-4">
                  <p className="text-gray-500">No se encontraron productos</p>
                </div>
              )}
            </div>
          )}

          {selectedProduct && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-2">Detalles del producto seleccionado</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Number.parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={unitPrice}
                    onChange={(e) => setUnitPrice(Number.parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="mt-4 text-right">
                <p className="text-sm font-medium">Total: ${(quantity * unitPrice).toFixed(2)}</p>
              </div>
              <div className="mt-4 flex justify-end">
                <Button onClick={handleAddItem}>Agregar al Movimiento</Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
