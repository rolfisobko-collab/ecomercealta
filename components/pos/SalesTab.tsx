"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Search, Plus, Minus, Trash2, ShoppingCart, DollarSign, RotateCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { updateProductStock } from "@/services/hybrid/productService"
import type { Product as ProductType } from "@/models/Product"
import { Product as ProductModel } from "@/models/Product"
import { useCurrency } from "@/context/CurrencyContext"
import { getExchangeRate } from "@/utils/currencyUtils"
import { categoryService } from "@/services/hybrid/categoryService"
import type { Category } from "@/models/Category"
import { addDoc, collection, serverTimestamp, doc, updateDoc, Timestamp, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

type CartItem = ProductType & {
  cartQuantity: number
  currentPrice: number // Precio actual (editable)
  originalPrice: number // Precio original del producto
  subtotal: number
}

const ProductListSkeleton = () => (
  <div className="divide-y divide-gray-100 dark:divide-gray-600">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-5 gap-4">
        <div className="flex-1 min-w-0">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse mb-3"></div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-20 animate-pulse"></div>
          </div>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4">
          <div className="text-right">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-28 animate-pulse mb-2"></div>
            <div className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full w-24 animate-pulse"></div>
          </div>
          <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse flex-shrink-0"></div>
        </div>
      </div>
    ))}
  </div>
)

export function SalesTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cart, setCart] = useState<CartItem[]>([])
  const [products, setProducts] = useState<ProductType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [skip, setSkip] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const PAGE_SIZE = 100000
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [successSale, setSuccessSale] = useState<{ id: string; saleNumber: string } | null>(null)
  const { toast } = useToast()

  const [selectedCategory, setSelectedCategory] = useState("")
  const [categoriesData, setCategoriesData] = useState<Category[]>([])

  const { currency } = useCurrency()
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [cartDocId, setCartDocId] = useState<string | null>(null)
  const [categorySelectOpen, setCategorySelectOpen] = useState(false)
  
  // Derived totals used by effects and UI
  const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0)
  const total = subtotal

  const productsContainerRef = useRef<HTMLDivElement>(null)

  // Fast paginated loader from Mongo API
  const fetchProducts = useRef<(
    opts?: { reset?: boolean }
  ) => Promise<void>>(async (_opts) => {})

  fetchProducts.current = async ({ reset = false } = {}) => {
    if (reset) {
      setIsLoading(true)
      setSkip(0)
      setHasMore(true)
    } else {
      if (isLoadingMore || !hasMore) return
      setIsLoadingMore(true)
    }

    const currentSkip = reset ? 0 : skip
    const params = new URLSearchParams()
    params.set('limit', String(PAGE_SIZE))
    params.set('skip', String(currentSkip))
    const q = searchTerm.trim()
    if (q) params.set('q', q)
    if (selectedCategory) params.set('category', selectedCategory)

    try {
      const res = await fetch(`/api/products?${params.toString()}`, { cache: 'no-store' })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const listRaw: any[] = Array.isArray(data) ? data : []
      // Normalize to local Product class instances (ensures profit/toJSON exist)
      const list: ProductType[] = listRaw.map((p: any) => new ProductModel({
        id: String(p.id),
        name: p.name || '',
        description: p.description || '',
        price: Number(p.price || 0),
        cost: Number(p.cost || 0),
        stock: Number(p.stock ?? p.quantity ?? 0),
        categoryId: String(p.categoryId ?? p.category ?? ''),
        images: Array.isArray(p.images) ? p.images : [],
        isInStock: Boolean(p.isInStock ?? (Number(p.stock ?? p.quantity ?? 0) > 0)),
        location: p.location || '',
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString(),
        lastManualUpdate: p.lastManualUpdate || undefined,
      }))
      if (reset) {
        // set fresh
        setProducts(list)
      } else {
        // merge unique by id to avoid duplicates
        setProducts((prev) => {
          const map = new Map<string, ProductType>()
          for (const p of prev) map.set(String((p as any).id), p)
          for (const p of list) map.set(String((p as any).id), p)
          return Array.from(map.values())
        })
      }
      const loaded = list.length
      setSkip(currentSkip + loaded)
      // Load all at once; no further pagination
      setHasMore(false)
    } catch (e) {
      console.error('Error loading products:', e)
      if (!reset) setHasMore(false)
    } finally {
      if (reset) setIsLoading(false)
      setIsLoadingMore(false)
    }
  }

  // Initial and on filter/search change
  useEffect(() => {
    fetchProducts.current({ reset: true })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchTerm])

  // Autosave del carrito en Firestore (carritos armados)
  useEffect(() => {
    const persistCart = async () => {
      try {
        const payload = {
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.currentPrice, quantity: i.cartQuantity, subtotal: i.subtotal })),
          subtotal,
          total,
          paymentMethod,
          status: 'open',
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp() as unknown as Timestamp,
        }
        let id = cartDocId || localStorage.getItem('pos_cart_id')
        if (!id) {
          const ref = await addDoc(collection(db, 'pos_carts'), payload)
          id = ref.id
          setCartDocId(id)
          localStorage.setItem('pos_cart_id', id)
        } else {
          await updateDoc(doc(db, 'pos_carts', id), payload)
        }
      } catch (e) {
        // no bloquear POS
      }
    }
    // Solo persistir si hay items
    if (cart.length > 0) {
      persistCart()
    }
  }, [cart, subtotal, total, paymentMethod, cartDocId])

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await categoryService.getAll()
        setCategoriesData(cats)
      } catch (error) {
        console.error("Error loading categories:", error)
        toast({ title: "Error", description: "No se pudieron cargar las categorías.", variant: "destructive" })
      }
    }
    loadCategories()
  }, [toast])

  // Manejar teclas de acceso rápido para categorías
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Solo procesar si no estamos escribiendo en un input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = event.key
      // Atajo por PRIMERA LETRA de la categoría (a-z)
      if (key.length === 1 && /[a-zA-Z]/.test(key)) {
        const lower = key.toLowerCase()
        const category = categoriesData.find((c) => c.name?.trim().toLowerCase().startsWith(lower))
        if (category) {
          // Seleccionar categoría y abrir el Select controlado
          setSelectedCategory(category.id)
          setCategorySelectOpen(true)
          toast({
            title: "Categoría seleccionada",
            description: `Categoría: ${category.name}`,
          })
          // Evitar que el buscador capture el caracter
          event.preventDefault()
          event.stopPropagation()
          return
        }
        // Si no hay coincidencia por letra, continuamos con el comportamiento de tipiado rápido hacia la búsqueda
      }

      // Tecla 'Escape' para limpiar filtros
      if (key === 'Escape') {
        setSearchTerm("")
        setSelectedCategory("")
        toast({
          title: "Filtros limpiados",
          description: "Búsqueda y categoría reiniciadas",
        })
      }

      // Tipiado rápido: enfocar búsqueda y agregar carácter (si no se seleccionó categoría por letra)
      if (key.length === 1 && /[\p{L}\p{N}\s]/u.test(key)) {
        const el = searchInputRef.current
        if (el) {
          el.focus()
          const selStart = el.selectionStart ?? el.value.length
          const selEnd = el.selectionEnd ?? el.value.length
          const newVal = el.value.slice(0, selStart) + key + el.value.slice(selEnd)
          setSearchTerm(newVal)
          // Colocar cursor al final del caracter insertado
          requestAnimationFrame(() => {
            el.selectionStart = el.selectionEnd = selStart + 1
          })
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress, { capture: true })
    return () => {
      document.removeEventListener('keydown', handleKeyPress, { capture: true } as any)
    }
  }, [categoriesData, toast])

  const getCategoryName = (categoryId: string) => {
    const category = categoriesData.find((cat) => cat.id === categoryId)
    return category?.name || categoryId
  }

  const filteredProducts = useMemo(() => {
    let filtered = products
    if (selectedCategory) {
      filtered = filtered.filter((product) => product.categoryId === selectedCategory)
    }
    if (searchTerm.trim() !== "") {
      const lowerCaseSearch = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(lowerCaseSearch) ||
          product.description.toLowerCase().includes(lowerCaseSearch) ||
          (product as any).brand?.toLowerCase().includes(lowerCaseSearch) ||
          getCategoryName(product.categoryId).toLowerCase().includes(lowerCaseSearch),
      )
    }
    return filtered
  }, [searchTerm, selectedCategory, products, categoriesData])

  const addToCart = (product: ProductType) => {
    const existingItem = cart.find((item) => item.id === product.id)
    if (existingItem) {
      if (existingItem.cartQuantity < (product as any).stock) {
        setCart(
          cart.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  cartQuantity: item.cartQuantity + 1,
                  subtotal: (item.cartQuantity + 1) * item.currentPrice,
                }
              : item,
          ),
        )
      } else {
        toast({
          title: "Stock insuficiente",
          description: `Solo hay ${(product as any).stock} unidades disponibles`,
          variant: "destructive",
        })
      }
    } else {
      if ((product as any).stock === 0) {
        toast({ title: "Sin stock", description: "Este producto no tiene stock disponible", variant: "destructive" })
        return
      }
      setCart([
        ...cart,
        {
          ...(product as any),
          cartQuantity: 1,
          currentPrice: product.price,
          originalPrice: product.price,
          subtotal: product.price,
        } as CartItem,
      ])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    const productInCatalog = products.find((p) => p.id === productId)
    if (!productInCatalog) return

    if (newQuantity <= 0) {
      removeFromCart(productId)
      return
    }

    if (newQuantity > (productInCatalog as any).stock) {
      toast({
        title: "Stock insuficiente",
        description: `Solo hay ${(productInCatalog as any).stock} unidades disponibles`,
        variant: "destructive",
      })
      return
    }

    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              cartQuantity: newQuantity,
              subtotal: newQuantity * item.currentPrice,
            }
          : item,
      ),
    )
  }

  const updatePrice = (productId: string, newPrice: number) => {
    if (newPrice < 0) {
      toast({
        title: "Precio inválido",
        description: "El precio no puede ser negativo",
        variant: "destructive",
      })
      return
    }

    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              currentPrice: newPrice,
              subtotal: item.cartQuantity * newPrice,
            }
          : item,
      ),
    )
  }

  const resetPrice = (productId: string) => {
    setCart(
      cart.map((item) =>
        item.id === productId
          ? {
              ...item,
              currentPrice: item.originalPrice,
              subtotal: item.cartQuantity * item.originalPrice,
            }
          : item,
      ),
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId))
  }


  const processSale = async () => {
    if (isProcessing) return
    setIsProcessing(true)
    if (cart.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de procesar la venta",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    const exchangeRate = getExchangeRate("USD", "ARS")

    const generateReceipt = () => {
      const now = new Date()
      const receiptDate = now.toLocaleDateString("es-AR")
      const receiptTime = now.toLocaleTimeString("es-AR")
      const currencySymbol = currency === "ARS" ? "ARS $" : "USD $"

      const formatPrice = (price: number) => {
        const convertedPrice = currency === "ARS" ? price * exchangeRate : price
        return currency === "ARS" ? convertedPrice.toFixed(0) : convertedPrice.toFixed(2)
      }

      let receipt = `
================================
      COMPROBANTE DE VENTA
================================
Fecha: ${receiptDate}
Hora: ${receiptTime}
--------------------------------
PRODUCTOS:
--------------------------------
`
      cart.forEach((item) => {
        const itemName = item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name
        const itemPrice = formatPrice(item.currentPrice)
        const itemTotal = formatPrice(item.subtotal)
        receipt += `${itemName}
`
        receipt += `${item.cartQuantity} x ${currencySymbol}${itemPrice} = ${currencySymbol}${itemTotal}
`
        receipt += `--------------------------------
`
      })

      receipt += `
SUBTOTAL:           ${currencySymbol}${formatPrice(subtotal)}
--------------------------------
TOTAL:              ${currencySymbol}${formatPrice(total)}
--------------------------------
Método de pago: ${paymentMethod === "cash" ? "Efectivo" : paymentMethod === "card" ? "Tarjeta" : "Transferencia"}
--------------------------------
¡Gracias por su compra!
Conserve este comprobante
================================
`
      return receipt
    }

    const printReceipt = () => {
      const receiptContent = generateReceipt()
      const printWindow = window.open("", "_blank", "width=300,height=600")
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Comprobante de Venta</title>
              <style>
                @media print {
                  @page {
                    size: 73mm auto;
                    margin: 0;
                  }
                  body {
                    font-family: 'Courier New', monospace;
                    font-size: 10px;
                    line-height: 1.2;
                    margin: 0;
                    padding: 2mm;
                    width: 69mm;
                  }
                }
                body {
                  font-family: 'Courier New', monospace;
                  font-size: 10px;
                  line-height: 1.2;
                  margin: 0;
                  padding: 5px;
                  white-space: pre-wrap;
                }
              </style>
            </head>
            <body>
              ${receiptContent.replace(/\n/g, "<br>")}
            </body>
          </html>
        `)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
          printWindow.close()
        }, 500)
      }
    }

    try {
      // Actualizar stock de productos ANTES de guardar la venta
      console.log("🔄 Actualizando stock de productos...")
      const stockUpdatePromises = cart.map(async (item) => {
        const current = (item as any).stock ?? 0
        const newStock = Math.max(0, current - item.cartQuantity)
        console.log(`📦 Actualizando stock de ${item.name}: ${current} -> ${newStock}`)
        return await updateProductStock(item.id, newStock, { name: item.name, brand: (item as any).brand, categoryId: item.categoryId })
      })

      // Esperar a que se actualicen todos los stocks
      const stockUpdateResults = await Promise.all(stockUpdatePromises)
      const failedUpdates = stockUpdateResults.filter((result) => !result)

      if (failedUpdates.length > 0) {
        toast({
          title: "Error al actualizar stock",
          description: "Algunos productos no pudieron actualizarse. Verifica el inventario.",
          variant: "destructive",
        })
        return
      }

      // Crear la venta con la estructura esperada por /admin/caja
      const saleData = {
        saleNumber: `SALE-${Date.now()}`,
        date: new Date().toLocaleDateString("es-AR"),
        time: new Date().toLocaleTimeString("es-AR"),
        items: cart.map((item) => ({
          name: item.name,
          quantity: item.cartQuantity,
          price: item.currentPrice, // Usar el precio actual (modificado)
          originalPrice: item.originalPrice, // Guardar también el precio original
          subtotal: item.subtotal,
        })),
        subtotal: subtotal,
        total: total,
        currency: "USD", // Siempre guardamos en USD como base
        paymentMethod: paymentMethod,
        status: "pending", // Pendiente hasta que se cobre en caja
        // Información adicional para el display
        displayCurrency: currency,
        exchangeRate: currency === "ARS" ? exchangeRate : 1,
        displayTotal: currency === "ARS" ? total * exchangeRate : total,
      }

      const apiRes = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      })
      if (!apiRes.ok) throw new Error(await apiRes.text())
      const created = await apiRes.json()
      const docRef = { id: String(created.id || created._id) }
      console.log("✅ Sale saved (Mongo) with ID:", docRef.id)

      // Marcar carrito como completado
      try {
        const savedId = cartDocId || localStorage.getItem('pos_cart_id')
        if (savedId) {
          await updateDoc(doc(db, 'pos_carts', savedId), {
            status: 'completed',
            completedAt: serverTimestamp(),
            saleId: docRef.id,
          })
          localStorage.removeItem('pos_cart_id')
          setCartDocId(null)
        }
      } catch {}

      printReceipt()

      toast({
        title: "Venta registrada",
        description: `Venta ${saleData.saleNumber} registrada exitosamente. Puede cobrarla desde la sección de Caja.`,
      })

      setCart([])
      setSuccessSale({ id: docRef.id, saleNumber: saleData.saleNumber })
      setIsProcessing(false)
    } catch (error) {
      console.error("❌ Error processing sale:", error)
      toast({ title: "Error", description: "Error al procesar la venta. Intente nuevamente.", variant: "destructive" })
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Products Section */}
      <div className="space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl border-0 rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-500/20 to-transparent rounded-bl-3xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-purple-500/10 to-transparent rounded-tr-3xl"></div>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-b border-blue-100 dark:border-blue-800/50 p-6">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                <Search className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Catálogo de Productos
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 relative z-10">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Buscar productos... (ESC para limpiar)"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      ref={searchInputRef}
                      className="pl-12 h-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-lg"
                    />
                  </div>
                </div>
                <Select
                  open={categorySelectOpen}
                  onOpenChange={setCategorySelectOpen}
                  value={selectedCategory || 'all'}
                  onValueChange={(v) => setSelectedCategory(v === 'all' ? '' : v)}
                >
                  <SelectTrigger className="px-3 py-3 h-12 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-300 shadow-lg font-medium w-40 sm:w-56 md:w-64 flex-none">
                    <SelectValue placeholder="🏷️ Todas las categorías" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">🏷️ Todas las categorías</SelectItem>
                    {categoriesData.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>📦 {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Hint removed by request */}
              <div className="bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm border-2 border-gray-100 dark:border-gray-600 rounded-2xl shadow-xl overflow-hidden">
                <div
                  ref={productsContainerRef}
                  className="max-h-[50vh] overflow-y-auto"
                >
                  {isLoading ? (
                    <ProductListSkeleton />
                  ) : filteredProducts.length === 0 ? (
                    <div className="p-8 text-center">
                      <div className="text-gray-500 dark:text-gray-400">
                        <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No se encontraron productos</p>
                        <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-600">
                      {filteredProducts.map((product) => (
                        <div
                          key={product.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-900/20 dark:hover:to-purple-900/20 transition-all duration-300 gap-4 group ${
                            (product as any).stock > 0 ? "cursor-pointer" : "opacity-60 cursor-not-allowed"
                          }`}
                          onClick={() => {
                            if ((product as any).stock > 0) {
                              addToCart(product)
                            }
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-base text-gray-900 dark:text-white break-words leading-tight mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                              {product.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                📂 {getCategoryName((product as any).categoryId)}
                              </span>
                              {(product as any).brand && (
                                <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full font-medium">
                                  🏷️ {(product as any).brand}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-4">
                            <div className="text-right">
                              <p className="font-bold text-2xl text-gray-900 dark:text-white mb-1">
                                {currency === "USD"
                                  ? `$${product.price.toFixed(2)}`
                                  : `ARS $${(product.price * getExchangeRate("USD", "ARS")).toFixed(0)}`}
                              </p>
                              <Badge
                                variant={
                                  (product as any).stock > 10 ? "default" : (product as any).stock > 0 ? "secondary" : "destructive"
                                }
                                className={`text-sm font-bold px-3 py-1 ${
                                  (product as any).stock > 10
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                                    : (product as any).stock > 0
                                      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300"
                                      : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300"
                                }`}
                              >
                                📦 Stock: {(product as any).stock}
                              </Badge>
                            </div>
                            <Button
                              size="lg"
                              disabled={(product as any).stock === 0}
                              className="h-12 w-12 p-0 flex-shrink-0 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 rounded-xl"
                              onClick={(e) => {
                                e.stopPropagation()
                                addToCart(product)
                              }}
                            >
                              <Plus className="h-6 w-6 text-white" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Load more disabled: everything is loaded in one go */}
                  {false && !isLoading && filteredProducts.length > 0 && (
                    <div className="p-4 text-center">
                      <Button variant="outline" disabled={isLoadingMore} onClick={() => fetchProducts.current({ reset: false })}>
                        {isLoadingMore ? 'Cargando…' : 'Cargar más'}
                      </Button>
                      <div className="mt-2 text-xs text-gray-500">Se cargan {PAGE_SIZE} productos por vez</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cart Section */}
      <div className="space-y-6">
        <Card className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl shadow-2xl border-0 rounded-3xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-green-500/20 to-transparent rounded-bl-3xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/10 to-transparent rounded-tr-3xl"></div>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-800/50 p-6">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Carrito de Compras
              </span>
              {cart.length > 0 && (
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold px-3 py-1 rounded-full shadow-lg animate-pulse">
                  {cart.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 relative z-10">
            <div className="space-y-6">
              {cart.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 dark:text-gray-500">
                    <ShoppingCart className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-lg mb-2">El carrito está vacío</p>
                    <p className="text-sm">Agrega productos desde el catálogo</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100 dark:border-gray-600 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0 pr-3">
                            <h4 className="font-bold text-base text-gray-900 dark:text-white truncate mb-1">
                              {item.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full">
                                💰 Original:{" "}
                                {currency === "USD"
                                  ? `$${item.originalPrice.toFixed(2)}`
                                  : `ARS $${(item.originalPrice * getExchangeRate("USD", "ARS")).toFixed(0)}`}
                              </span>
                              {item.currentPrice !== item.originalPrice && (
                                <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300 rounded-full font-medium">
                                  {item.currentPrice > item.originalPrice ? "📈 Aumentado" : "📉 Descuento"}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-lg text-green-600 dark:text-green-400">
                              {currency === "USD"
                                ? `$${item.subtotal.toFixed(2)}`
                                : `ARS $${(item.subtotal * getExchangeRate("USD", "ARS")).toFixed(0)}`}
                            </p>
                          </div>
                        </div>

                        {/* Price Editor */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800/50">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                              Precio por unidad:
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              {currency === "USD" ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.currentPrice}
                                  onChange={(e) => {
                                    const newPrice = Number.parseFloat(e.target.value) || 0
                                    updatePrice(item.id, newPrice)
                                  }}
                                  className="h-10 bg-white/80 dark:bg-gray-700/80 border-2 border-blue-200 dark:border-blue-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 font-bold text-center"
                                  placeholder="0.00"
                                />
                              ) : (
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={Math.round(item.currentPrice * getExchangeRate("USD", "ARS"))}
                                  onChange={(e) => {
                                    const newPriceARS = Number.parseFloat(e.target.value) || 0
                                    const newPriceUSD = newPriceARS / getExchangeRate("USD", "ARS")
                                    updatePrice(item.id, newPriceUSD)
                                  }}
                                  className="h-10 bg-white/80 dark:bg-gray-700/80 border-2 border-blue-200 dark:border-blue-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 font-bold text-center"
                                  placeholder="0"
                                />
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-10 px-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-500 hover:border-orange-300 dark:hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-300 rounded-lg"
                              onClick={() => resetPrice(item.id)}
                              title="Restaurar precio original"
                            >
                              <RotateCcw className="h-4 w-4 text-orange-500" />
                            </Button>
                          </div>
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                            {currency === "USD"
                              ? `≈ ARS $${(item.currentPrice * getExchangeRate("USD", "ARS")).toFixed(0)}`
                              : `≈ USD $${(item.currentPrice).toFixed(2)}`}
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-600 rounded-xl p-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-500 hover:border-red-300 dark:hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 rounded-lg"
                              onClick={() => updateQuantity(item.id, item.cartQuantity - 1)}
                            >
                              <Minus className="h-4 w-4 text-red-500" />
                            </Button>
                            <span className="w-12 text-center text-base font-bold text-gray-900 dark:text-white">
                              {item.cartQuantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-500 hover:border-green-300 dark:hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 rounded-lg"
                              onClick={() => updateQuantity(item.id, item.cartQuantity + 1)}
                            >
                              <Plus className="h-4 w-4 text-green-500" />
                            </Button>
                          </div>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 w-8 p-0 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 rounded-lg"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-white" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                  <div className="space-y-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-2xl p-6 border border-blue-100 dark:border-blue-800/50">
                    <div className="flex justify-between text-lg font-medium text-gray-700 dark:text-gray-300">
                      <span>💰 Subtotal:</span>
                      <span>
                        {currency === "USD"
                          ? `$${subtotal.toFixed(2)}`
                          : `ARS $${(subtotal * getExchangeRate("USD", "ARS")).toFixed(0)}`}
                      </span>
                    </div>
                    <Separator className="bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent" />
                    <div className="flex justify-between font-bold text-2xl">
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        🎯 Total:
                      </span>
                      <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {currency === "USD"
                          ? `$${total.toFixed(2)}`
                          : `ARS $${(total * getExchangeRate("USD", "ARS")).toFixed(0)}`}
                      </span>
                    </div>
                  </div>
                  <Button
                    className="w-full h-16 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 text-white font-bold text-lg rounded-2xl shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 relative overflow-hidden group"
                    onClick={processSale}
                    disabled={isProcessing}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                    <ShoppingCart className="h-6 w-6 animate-bounce" />
                    <span>💳 Procesar Venta</span>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-yellow-300 rounded-full animate-ping"></div>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Modal */}
      {successSale && (
        <div className="fixed inset-0 z-[99999] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <div className="text-center space-y-2">
              <h3 className="text-xl font-bold">Venta registrada</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Número: <span className="font-mono font-semibold">{successSale.saleNumber}</span></p>
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setSuccessSale(null)}>Cerrar</Button>
              <Button onClick={() => { window.location.href = '/admin/caja' }}>Ir a Caja</Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
