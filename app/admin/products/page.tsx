"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Search, Edit, Trash2, Package, AlertCircle, Image as ImageIcon, DollarSign, Grid3x3, List, FileText, CheckSquare, Square } from "lucide-react"
import { getAllProducts } from "@/services/hybrid/productService"
import { getAllCategories } from "@/services/hybrid/categoryService"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Skeleton } from "@/components/ui/skeleton"

interface Product {
  id: string
  name: string
  description: string
  price: number
  quantity: number
  category: string
  brand?: string
  model?: string
  images: string[]
  image1?: string
  updatedAt?: string | Date
  createdAt?: string | Date
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")
  const [imageFilter, setImageFilter] = useState<string>("all")
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)
  const [editingLocation, setEditingLocation] = useState<string | null>(null)
  const { toast } = useToast()

  // Función para formatear fecha
  const formatDate = (date: string | Date | undefined) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Actualiza un campo específico del producto (sin recargar la página)
  const updateProductField = async (productId: string, field: string, value: any) => {
    try {
      const payload: any = {
        id: productId,
        updatedAt: new Date(),
      }
      // normalizar numéricos
      payload[field] = (field === 'price' || field === 'quantity')
        ? Number(value)
        : value

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Error al actualizar producto')

      // Optimistic update
      setProducts(prev => prev.map(p =>
        p.id === productId
          ? { ...p, [field]: payload[field], updatedAt: payload.updatedAt }
          : p
      ))

      // Silencioso: no mostrar alert/Toast al guardar correctamente
    } catch (e) {
      console.error('updateProductField error:', e)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el producto',
        variant: 'destructive',
      })
    }
  }

  // Edición inline: helpers para blur/Enter
  const commitOnEnter = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur()
      e.preventDefault()
    }
  }

  // Carga de productos y categorías
  const fetchData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getAllProducts(),
        getAllCategories()
      ])
      setProducts(productsData as any)
      setCategories(categoriesData as any)
      setLastUpdated(new Date())
      return true
    } catch (error) {
      console.error('Error fetching data:', error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos. Intenta recargar la página.",
        variant: "destructive",
      })
      return false
    } finally {
      setLoading(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    fetchData()
  }, [])

  // Load persisted filters on mount
  useEffect(() => {
    try {
      const persisted = JSON.parse(localStorage.getItem('admin_products_filters') || '{}')
      if (persisted.searchTerm) setSearchTerm(persisted.searchTerm)
      if (persisted.categoryFilter) setCategoryFilter(persisted.categoryFilter)
      if (persisted.stockFilter) setStockFilter(persisted.stockFilter)
      if (persisted.imageFilter) setImageFilter(persisted.imageFilter)
      if (persisted.locationFilter) setLocationFilter(persisted.locationFilter)
      if (persisted.viewMode) setViewMode(persisted.viewMode)
    } catch {}
  }, [])

  // Persist filters on change
  useEffect(() => {
    const toSave = { searchTerm, categoryFilter, stockFilter, imageFilter, locationFilter, viewMode }
    localStorage.setItem('admin_products_filters', JSON.stringify(toSave))
  }, [searchTerm, categoryFilter, stockFilter, imageFilter, locationFilter, viewMode])

  // Set up polling for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Filtrado optimizado con useMemo
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
      
      const matchesStock = stockFilter === "all" ||
                          (stockFilter === "low" && (product.quantity || 0) <= 5) ||
                          (stockFilter === "out" && (product.quantity || 0) === 0) ||
                          (stockFilter === "in" && (product.quantity || 0) > 5)
      
      const hasImage = product.image1 || (product.images && product.images.length > 0)
      const matchesImage = imageFilter === "all" ||
                          (imageFilter === "no-image" && !hasImage) ||
                          (imageFilter === "with-image" && hasImage)
      const locationValue = (product as any).location || (product as any).ubicacion || ""
      const matchesLocation = locationFilter === "all" || locationValue === locationFilter
      
      return matchesSearch && matchesCategory && matchesStock && matchesImage && matchesLocation
    })
  }, [products, searchTerm, categoryFilter, stockFilter, imageFilter, locationFilter])

  const locationOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of products as any[]) {
      const v = p.location || p.ubicacion
      if (v) set.add(String(v))
    }
    return Array.from(set).sort()
  }, [products])

  // Helpers para exportaciones
  const getTargetItems = () => {
    // Si hay seleccionados, usar esos; sino, los filtrados actuales
    const selected = products.filter(p => selectedProducts.has(p.id))
    return selectedProducts.size > 0 ? selected : filteredProducts
  }

  const buildExportText = (items: Product[]) => {
    const lines = items.map(p => {
      const catName = categories.find(c => c.id === p.category)?.name || 'Sin categoría'
      const price = (p.price ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      return `${p.name}\nPrecio: $${price}\nStock: ${p.quantity ?? 0}\nCategoría: ${catName}\n${'-'.repeat(50)}`
    })
    return lines.join('\n\n')
  }

  const exportTXT = () => {
    const items = getTargetItems()
    if (items.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay productos para exportar', variant: 'destructive' })
      return
    }
    const text = buildExportText(items)
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `productos-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyToClipboard = async () => {
    const items = getTargetItems()
    if (items.length === 0) {
      toast({ title: 'Sin datos', description: 'No hay productos para copiar', variant: 'destructive' })
      return
    }
    const text = buildExportText(items)
    await navigator.clipboard.writeText(text)
    toast({ title: 'Copiado', description: `Se copiaron ${items.length} productos al portapapeles` })
  }

  const exportPDF = async () => {
    try {
      const items = getTargetItems()
      if (items.length === 0) {
        toast({ title: 'Sin datos', description: 'No hay productos para exportar', variant: 'destructive' })
        return
      }

      // Intentar cargar jsPDF dinámicamente SIN que Next lo resuelva en build
      // Usamos eval(Function) para evitar el análisis estático del bundler
      const loadJsPDF = async () => {
        try {
          const mod = await (Function('return import("jspdf")')() as Promise<any>)
          return mod?.default ?? null
        } catch {
          return null
        }
      }
      // @ts-ignore opcional
      const jsPDF = await loadJsPDF()
      if (!jsPDF) {
        // Fallback a impresión en navegador
        const text = buildExportText(items).replaceAll('\n', '<br/>')
        const win = window.open('', '_blank')
        if (win) {
          win.document.write(`<!doctype html><html><head><title>Exportación</title></head><body>`)
          win.document.write(`<div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">`)
          win.document.write(`<img src="/images/logo.png" alt="Logo" style="height:40px"/>`)
          win.document.write(`<h2 style="margin:0">Listado de productos (${items.length})</h2>`)
          win.document.write(`</div>`)
          win.document.write(`<div style="font-family:monospace;white-space:pre-wrap">${text}</div>`)
          win.document.write(`</body></html>`)
          win.document.close()
          win.focus()
          win.print()
        }
        toast({ title: 'jsPDF no instalado', description: 'Usé impresión del navegador como alternativa.' })
        return
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' })

      // Cargar logo y transformarlo a dataURL
      const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = src
      })
      const img = await loadImage('/images/logo.png').catch(() => null)
      if (img) {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const w = 160, h = (img.height / img.width) * 160
          canvas.width = w
          canvas.height = h
          ctx.drawImage(img, 0, 0, w, h)
          const dataUrl = canvas.toDataURL('image/png')
          doc.addImage(dataUrl, 'PNG', 40, 30, w, h)
        }
      }

      let y = 40 + 60 // margen + altura estimada del logo
      doc.setFontSize(14)
      doc.text(`Listado de productos (${items.length})`, 40, y)
      y += 20
      doc.setFont('Courier', 'normal')
      doc.setFontSize(11)

      const lineHeight = 16
      items.forEach((p, idx) => {
        const catName = categories.find(c => c.id === p.category)?.name || 'Sin categoría'
        const price = (p.price ?? 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        const block = [
          `${idx + 1}. ${p.name}`,
          `Precio: $${price} | Stock: ${p.quantity ?? 0} | Cat: ${catName}`,
          ''.padEnd(60, '-')
        ]
        block.forEach(line => {
          if (y > 780) { // salto de página simple
            doc.addPage()
            y = 60
          }
          doc.text(line, 40, y)
          y += lineHeight
        })
      })

      doc.save(`productos-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (e) {
      console.error('exportPDF error', e)
      toast({ title: 'Error', description: 'No se pudo generar el PDF', variant: 'destructive' })
    }
  }

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredProducts.slice(start, start + itemsPerPage)
  }, [filteredProducts, currentPage, itemsPerPage])

  const handleDelete = async () => {
    if (!productToDelete) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(productToDelete.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())
      
      // Actualizar el estado local inmediatamente
      setProducts(prev => prev.filter(p => p.id !== productToDelete.id))
      
      toast({
        title: "Producto eliminado",
        description: `${productToDelete.name} fue eliminado correctamente`,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setProductToDelete(null)
    }
  }

  const getCategoryName = (categoryId: string) => {
    const cat = categories.find(c => c.id === categoryId)
    return cat?.name || 'Sin categoría'
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Productos</h1>
          <p className="text-muted-foreground">Gestiona tu catálogo de productos</p>
        </div>
        <div className="flex gap-2">
          {selectedProducts.size > 0 && (
            <Button
              variant="outline"
              onClick={() => {
                const selected = products.filter(p => selectedProducts.has(p.id))
                const text = selected.map(p => 
                  `${p.name}\nPrecio: $${p.price || 0}\nStock: ${p.quantity || 0}\nCategoría: ${categories.find(c => c.id === p.category)?.name || 'Sin categoría'}\n${'-'.repeat(50)}`
                ).join('\n\n')
                
                const blob = new Blob([text], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `productos-seleccionados-${new Date().toISOString().split('T')[0]}.txt`
                a.click()
                URL.revokeObjectURL(url)
                
                toast({
                  title: "Exportado",
                  description: `${selectedProducts.size} productos exportados a TXT`
                })
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              Exportar ({selectedProducts.size})
            </Button>
          )}
          {/* Botones globales de exportación/copiar (usa seleccionados o filtrados) */}
          <Button variant="secondary" onClick={copyToClipboard}>
            Copiar al portapapeles
          </Button>
          <Button variant="outline" onClick={exportTXT}>
            Exportar TXT
          </Button>
          <Button className="bg-red-600 hover:bg-red-700" onClick={exportPDF}>
            Exportar PDF
          </Button>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sin Precio</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {products.filter(p => !p.price || p.price === 0).length}
            </div>
            <p className="text-xs text-muted-foreground">Requieren precio</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          {/* Mobile toggle */}
          <div className="sm:hidden mb-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Filtros</span>
            <Button size="sm" variant="outline" onClick={() => setShowFiltersMobile(v => !v)}>
              {showFiltersMobile ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
          <div className={`${showFiltersMobile ? '' : 'hidden'} sm:grid grid gap-4 md:grid-cols-4`}>
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

            <Select value={categoryFilter} onValueChange={(value) => {
              setCategoryFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.slice().sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""))).map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={(value) => {
              setStockFilter(value)
              setCurrentPage(1)
            }}>
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

            <Select value={imageFilter} onValueChange={(value) => {
              setImageFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Imágenes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="no-image">Sin imágenes</SelectItem>
                <SelectItem value="with-image">Con imágenes</SelectItem>
              </SelectContent>
            </Select>
            <Select value={locationFilter} onValueChange={(value) => {
              setLocationFilter(value)
              setCurrentPage(1)
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Ubicación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ubicaciones</SelectItem>
                {locationOptions.map((loc) => (
                  <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>Mostrando {paginatedProducts.length} de {filteredProducts.length} productos</span>
            <div className="flex items-center gap-2">
              <span>{filteredProducts.length !== products.length && `(${products.length} total)`}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setCategoryFilter("all")
                  setStockFilter("all")
                  setImageFilter("all")
                  setLocationFilter("all")
                  setCurrentPage(1)
                }}
              >
                Borrar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Grid/List View */}
      {viewMode === 'grid' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginatedProducts.map((product) => (
            <Card key={product.id} className="hover:shadow-lg transition-shadow overflow-hidden relative">
              <div className="absolute top-2 left-2 z-10">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-white/80 hover:bg-white"
                  onClick={() => {
                    const newSelected = new Set(selectedProducts)
                    if (newSelected.has(product.id)) {
                      newSelected.delete(product.id)
                    } else {
                      newSelected.add(product.id)
                    }
                    setSelectedProducts(newSelected)
                  }}
                >
                  {selectedProducts.has(product.id) ? (
                    <CheckSquare className="h-4 w-4 text-red-600" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="aspect-square relative bg-gray-100">
                {(product.image1 || product.images?.[0]) ? (
                  <img
                    src={product.image1 || product.images[0]}
                    alt={product.name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <ImageIcon className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {(product.quantity || 0) <= 5 && (
                  <Badge className="absolute top-2 right-2" variant={(product.quantity || 0) === 0 ? "destructive" : "secondary"}>
                    {(product.quantity || 0) === 0 ? "Sin stock" : "Stock bajo"}
                  </Badge>
                )}
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm line-clamp-2 min-h-[2.5rem]">{product.name}</h3>
                
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Categoría:</span>
                    <span className="font-medium">{getCategoryName(product.category)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Stock:</span>
                    <span className={`font-medium ${(product.quantity || 0) <= 5 ? 'text-orange-600' : 'text-green-600'}`}>
                      {product.quantity || 0} unidades
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Precio:</span>
                    <span className="font-medium text-lg">${(product.price || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ubicación:</span>
                    <span className="font-medium">{String((product as any).location || (product as any).ubicacion || '—')}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link href={`/admin/products/edit/${product.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      setProductToDelete(product)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          if (selectedProducts.size === paginatedProducts.length) {
                            setSelectedProducts(new Set())
                          } else {
                            setSelectedProducts(new Set(paginatedProducts.map(p => p.id)))
                          }
                        }}
                      >
                        {selectedProducts.size === paginatedProducts.length ? (
                          <CheckSquare className="h-4 w-4" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </Button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Imagen</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                    <th className="px-4 py-3 hidden md:table-cell">Categoría</th>
                    <th className="px-4 py-3 hidden md:table-cell">Stock</th>
                    <th className="px-4 py-3 hidden md:table-cell">Ubicación</th>
                    <th className="px-4 py-3 hidden md:table-cell">Liquidación</th>
                    <th className="px-4 py-3 hidden lg:table-cell">Última Modificación</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-800">
                  {paginatedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => {
                            const newSelected = new Set(selectedProducts)
                            if (newSelected.has(product.id)) {
                              newSelected.delete(product.id)
                            } else {
                              newSelected.add(product.id)
                            }
                            setSelectedProducts(newSelected)
                          }}
                        >
                          {selectedProducts.has(product.id) ? (
                            <CheckSquare className="h-4 w-4 text-red-600" />
                          ) : (
                            <Square className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                          {(product.image1 || product.images?.[0]) ? (
                            <img
                              src={product.image1 || product.images[0]}
                              alt={product.name}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          defaultValue={product.name}
                          onBlur={(e) => e.target.value !== product.name && updateProductField(product.id, 'name', e.target.value)}
                          onKeyDown={commitOnEnter}
                          className="w-full text-sm font-medium bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                        />
                        <input
                          defaultValue={product.brand || ''}
                          placeholder="Marca"
                          onBlur={(e) => e.target.value !== (product.brand || '') && updateProductField(product.id, 'brand', e.target.value)}
                          onKeyDown={commitOnEnter}
                          className="mt-1 w-full text-xs text-gray-600 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                        />
                        <input
                          defaultValue={product.model || ''}
                          placeholder="Modelo"
                          onBlur={(e) => e.target.value !== (product.model || '') && updateProductField(product.id, 'model', e.target.value)}
                          onKeyDown={commitOnEnter}
                          className="mt-1 w-full text-xs text-gray-600 bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={product.price}
                          onBlur={(e) => updateProductField(product.id, 'price', Number(e.target.value || 0))}
                          onKeyDown={commitOnEnter}
                          className="w-28 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <select
                          defaultValue={product.category}
                          onChange={(e) => updateProductField(product.id, 'category', e.target.value)}
                          className="w-full text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                        >
                          {categories.slice().sort((a:any,b:any)=>String(a.name||"").localeCompare(String(b.name||""))).map((cat:any) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <input
                          type="number"
                          defaultValue={product.quantity || 0}
                          onBlur={(e) => updateProductField(product.id, 'quantity', Number(e.target.value || 0))}
                          onKeyDown={commitOnEnter}
                          className="w-24 text-sm bg-transparent border border-transparent hover:border-gray-200 focus:border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td
                        className="px-4 py-3 hidden md:table-cell"
                        onDoubleClick={() => setEditingLocation(product.id)}
                      >
                        {editingLocation === product.id ? (
                          <input
                            autoFocus
                            defaultValue={(product as any).location || (product as any).ubicacion || ''}
                            placeholder="Ubicación"
                            onBlur={(e) => {
                              const v = e.target.value
                              const prev = (product as any).location || (product as any).ubicacion || ''
                              if (v !== prev) updateProductField(product.id, 'location', v)
                              setEditingLocation(null)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur()
                              } else if (e.key === 'Escape') {
                                setEditingLocation(null)
                              }
                            }}
                            className="w-full border rounded px-2 py-1 text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium cursor-text" title="Doble click para editar">
                            {String((product as any).location || (product as any).ubicacion || '—')}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <label className="inline-flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            defaultChecked={(product as any).liquidation || false}
                            onChange={(e) => updateProductField(product.id, 'liquidation', e.target.checked)}
                          />
                          Liquidación
                        </label>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">{formatDate(product.updatedAt)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/admin/products/edit/${product.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setProductToDelete(product)
                              setDeleteDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNum)}
                  className={currentPage === pageNum ? "bg-red-600 hover:bg-red-700" : ""}
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredProducts.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron productos</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all" || stockFilter !== "all"
                ? "Intenta ajustar los filtros"
                : "Comienza agregando tu primer producto"}
            </p>
            <Link href="/admin/products/new">
              <Button className="bg-red-600 hover:bg-red-700">
                <Plus className="mr-2 h-4 w-4" />
                Agregar Producto
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás por eliminar "{productToDelete?.name}". Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
