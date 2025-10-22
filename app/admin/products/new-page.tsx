"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Search, Edit, Trash2, Package, AlertCircle, Image as ImageIcon, DollarSign, Grid3x3, List, FileText, CheckSquare, Square, ArrowLeft } from "lucide-react"
import { getAllProducts, deleteProduct, updateProduct } from "@/services/hybrid/productService"
import { getAllCategories } from "@/services/hybrid/categoryService"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export default function ProductsPage() {
  const router = useRouter()
  const { toast } = useToast()
  
  // State
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [imageFilter, setImageFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState('grid')
  const [selectedProducts, setSelectedProducts] = useState(new Set())
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isUpdating, setIsUpdating] = useState({})

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca'
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es })
    } catch (e) {
      return 'Fecha inválida'
    }
  }

  // Fetch data
  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getAllProducts(),
        getAllCategories()
      ])
      
      // Ensure products have required fields
      const processedProducts = productsData.map(product => ({
        ...product,
        quantity: product.quantity || 0,
        price: product.price || 0,
        images: product.images || [],
        category: product.category || '',
        updatedAt: product.updatedAt || product.createdAt || new Date()
      }))
      
      setProducts(processedProducts)
      setCategories(categoriesData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos. Intenta recargar la página.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchData, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  // Update product field
  const updateProductField = async (productId, field, value) => {
    if (!productId) return
    
    try {
      setIsUpdating(prev => ({ ...prev, [productId]: true }))
      
      // Convert to number if needed
      let processedValue = value
      if (['price', 'quantity', 'stock'].includes(field)) {
        processedValue = parseFloat(value) || 0
      }
      
      // Update in the database
      await updateProduct(productId, {
        [field]: processedValue,
        updatedAt: new Date().toISOString()
      })
      
      // Update local state
      setProducts(prev => prev.map(p => 
        p.id === productId 
          ? { ...p, [field]: processedValue, updatedAt: new Date().toISOString() }
          : p
      ))
      
      toast({
        title: "✅ Actualizado",
        description: `Se actualizó el campo correctamente`,
      })
      
    } catch (error) {
      console.error('Error updating product:', error)
      toast({
        title: "❌ Error",
        description: `No se pudo actualizar el campo: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsUpdating(prev => ({ ...prev, [productId]: false }))
    }
  }

  // Handle double click to edit
  const handleDoubleClick = (product, field) => {
    const currentValue = product[field] || ''
    const newValue = prompt(`Editar ${field}:`, currentValue.toString())
    
    if (newValue !== null && newValue !== currentValue.toString()) {
      updateProductField(product.id, field, newValue)
    }
  }

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.model?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = 
        categoryFilter === "all" || 
        product.category === categoryFilter
      
      const matchesStock = 
        stockFilter === "all" ||
        (stockFilter === "low" && (product.quantity || 0) <= 5) ||
        (stockFilter === "out" && (product.quantity || 0) === 0) ||
        (stockFilter === "in" && (product.quantity || 0) > 0)
      
      const hasImage = product.image1 || (product.images && product.images.length > 0)
      const matchesImage = 
        imageFilter === "all" ||
        (imageFilter === "no-image" && !hasImage) ||
        (imageFilter === "with-image" && hasImage)
      
      return matchesSearch && matchesCategory && matchesStock && matchesImage
    })
  }, [products, searchTerm, categoryFilter, stockFilter, imageFilter])

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  // Handle delete
  const handleDelete = async () => {
    if (!productToDelete) return
    
    setDeleting(true)
    try {
      await deleteProduct(productToDelete.id)
      
      // Update local state
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id))
      
      toast({
        title: "✅ Producto eliminado",
        description: `${productToDelete.name} fue eliminado correctamente`,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "❌ Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Sin categoría'
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || 'Sin categoría'
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1,2,3,4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-96 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">
            {filteredProducts.length} productos • Última actualización: {formatDate(lastUpdated)}
          </p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          
          <Link href="/admin/products/new">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Producto
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Productos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">En inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.reduce((sum, p) => sum + (p.quantity || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Bajo</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => (p.quantity || 0) <= 5 && (p.quantity || 0) > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">≤ 5 unidades</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Imágenes</CardTitle>
            <ImageIcon className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {products.filter(p => !p.image1 && (!p.images || p.images.length === 0)).length}
            </div>
            <p className="text-xs text-muted-foreground">Productos sin foto</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, descripción o marca..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="pl-10"
                />
              </div>
            </div>

            <Select 
              value={categoryFilter} 
              onValueChange={(value) => {
                setCategoryFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={stockFilter} 
              onValueChange={(value) => {
                setStockFilter(value)
                setCurrentPage(1)
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo el stock</SelectItem>
                <SelectItem value="in">Con stock (&gt;5)</SelectItem>
                <SelectItem value="low">Stock bajo (≤5)</SelectItem>
                <SelectItem value="out">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Mostrando {paginatedProducts.length} de {filteredProducts.length} productos</span>
            <span>{filteredProducts.length !== products.length && `(${products.length} total)`}</span>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedProducts.map((product) => (
            <Card key={product.id} className="relative group">
              <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/admin/products/edit/${product.id}`}>
                  <Button variant="outline" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
              
              <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-t-lg overflow-hidden">
                {product.image1 ? (
                  <img
                    src={product.image1}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <ImageIcon className="h-12 w-12" />
                  </div>
                )}
              </div>
              
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium line-clamp-2">{product.name}</h3>
                  <div className="font-bold text-lg whitespace-nowrap ml-2">
                    ${product.price?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <span className="w-20">Stock:</span>
                    <span className="font-medium">{product.quantity || 0}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-20">Categoría:</span>
                    <span className="font-medium">{getCategoryName(product.category)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Últ. actualización: {formatDate(product.updatedAt)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-md border">
            <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 dark:bg-gray-800 font-medium">
              <div className="col-span-4">Producto</div>
              <div className="col-span-2">Categoría</div>
              <div className="text-right">Precio</div>
              <div className="text-right">Stock</div>
              <div className="text-right">Últ. actualización</div>
              <div className="text-right">Acciones</div>
            </div>
            
            {paginatedProducts.map((product) => (
              <div 
                key={product.id} 
                className="grid grid-cols-12 gap-4 p-4 border-t hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <div className="col-span-4 font-medium flex items-center">
                  {product.image1 && (
                    <img 
                      src={product.image1} 
                      alt={product.name} 
                      className="h-10 w-10 rounded-md mr-3 object-cover"
                    />
                  )}
                  <div>
                    <div>{product.name}</div>
                    <div className="text-sm text-muted-foreground line-clamp-1">
                      {product.description}
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2 flex items-center">
                  {getCategoryName(product.category)}
                </div>
                
                <div className="text-right font-mono">
                  <Input
                    type="number"
                    value={product.price || ''}
                    onChange={(e) => updateProductField(product.id, 'price', e.target.value)}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value) || 0
                      updateProductField(product.id, 'price', value)
                    }}
                    className="w-32 text-right"
                    disabled={isUpdating[product.id]}
                  />
                </div>
                
                <div className="text-right">
                  <Input
                    type="number"
                    value={product.quantity || ''}
                    onChange={(e) => updateProductField(product.id, 'quantity', e.target.value)}
                    onBlur={(e) => {
                      const value = parseInt(e.target.value) || 0
                      updateProductField(product.id, 'quantity', value)
                    }}
                    className="w-24 text-right"
                    disabled={isUpdating[product.id]}
                  />
                </div>
                
                <div className="text-sm text-muted-foreground text-right">
                  {formatDate(product.updatedAt)}
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Link href={`/admin/products/edit/${product.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setProductToDelete(product)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar el producto <strong>{productToDelete?.name}</strong>. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
