import { db } from "@/lib/firebase"
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  query,
  onSnapshot,
  orderBy,
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore"
import type { Product } from "@/models/Product"

// Función para transformar un documento de Firestore en un objeto Product
const transformDoc = (doc: DocumentData): Product => {
  const data = doc.data()
  return {
    id: doc.id,
    name: data.name || "",
    description: data.description || "",
    markdownDescription: data.markdownDescription || "",
    price: data.price || 0,
    cost: data.cost || 0,
    points: typeof data.points === 'number' ? data.points : Math.max(0, Math.round((Number(data.price||0)) * 100)),
    redeemPoints: typeof data.redeemPoints === 'number' ? data.redeemPoints : 0,
    currency: data.currency || "USD",
    quantity: (typeof data.quantity === 'number' ? data.quantity : (typeof data.stock === 'number' ? data.stock : 0)),
    category: data.category || "",
    location: data.location || "",
    obs: data.obs || "",
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    lastManualUpdate: data.lastManualUpdate || null, // Añadido
    images: data.images || [],
    image1: data.image1 || "",
    image2: data.image2 || "",
    image3: data.image3 || "",
    image4: data.image4 || "",
    image5: data.image5 || "",
    youtubeVideoId: data.youtubeVideoId || null,
    youtubeUrl: data.youtubeUrl || "",
    isInStock: (typeof data.quantity === 'number' ? data.quantity : (typeof data.stock === 'number' ? data.stock : 0)) > 0,
    brand: data.brand || "",
    model: data.model || "",
    discount: data.discount || 0,
    isReward: Boolean(data.isReward || false),
  }
}

class ProductService {
  private productsCache: Product[] | null = null
  private productListeners: Map<string, () => void> = new Map()
  private isListenerActive = false
  private cacheCallbacks: Set<(products: Product[]) => void> = new Set()

  constructor() {
    this.setupProductsListener()
  }

  // Método para suscribirse a cambios de caché en tiempo real
  onCacheUpdate(callback: (products: Product[]) => void) {
    this.cacheCallbacks.add(callback)
    // Si ya tenemos datos, llamar inmediatamente
    if (this.productsCache) {
      callback(this.productsCache)
    }

    // Retornar función de limpieza
    return () => {
      this.cacheCallbacks.delete(callback)
    }
  }

  private notifyCacheUpdate() {
    if (this.productsCache) {
      this.cacheCallbacks.forEach((callback) => {
        try {
          callback(this.productsCache!)
        } catch (error) {
          console.error("Error in cache callback:", error)
        }
      })
    }
  }

  private setupProductsListener() {
    if (this.isListenerActive) return

    const productsCollection = collection(db, "stock")

    // Crear un listener que actualiza la caché cuando hay cambios EN TIEMPO REAL
    const unsubscribe = onSnapshot(
      query(productsCollection, orderBy("name")),
      (snapshot) => {
        console.log("🔄 Products listener triggered - INSTANT UPDATE")

        if (!snapshot.empty) {
          this.productsCache = snapshot.docs.map(transformDoc)
          console.log(`⚡ INSTANT cache update with ${this.productsCache.length} items`)

          // Notificar a todos los componentes INMEDIATAMENTE
          this.notifyCacheUpdate()
        } else {
          console.log("📭 No products found")
          this.productsCache = []
          this.notifyCacheUpdate()
        }
      },
      (error) => {
        console.error("❌ Error in products listener:", error)
        this.productsCache = []
        this.notifyCacheUpdate()
      },
    )

    this.productListeners.set("all", unsubscribe)
    this.isListenerActive = true
    console.log("🎧 INSTANT Products real-time listener activated")
  }

  // Método para actualizar stock INSTANTÁNEAMENTE
  async updateStock(productId: string, newQuantity: number): Promise<boolean> {
    try {
      console.log(`⚡ INSTANT stock update for ${productId}: ${newQuantity}`)

      // Actualizar en Firebase (esto disparará el listener automáticamente)
      const productRef = doc(db, "stock", productId)
      await updateDoc(productRef, {
        quantity: Math.max(0, newQuantity),
        updatedAt: serverTimestamp(),
      })

      // También actualizar la caché local INMEDIATAMENTE para UI instantánea
      if (this.productsCache) {
        const productIndex = this.productsCache.findIndex((p) => p.id === productId)
        if (productIndex !== -1) {
          this.productsCache[productIndex].quantity = Math.max(0, newQuantity)
          this.productsCache[productIndex].isInStock = newQuantity > 0

          // Notificar cambio INMEDIATAMENTE
          this.notifyCacheUpdate()
          console.log(`⚡ INSTANT local cache updated for ${productId}`)
        }
      }

      return true
    } catch (error) {
      console.error("❌ Error updating stock:", error)
      return false
    }
  }

  // Obtener todos los productos
  async getAll(): Promise<Product[]> {
    // Si ya tenemos datos en caché (actualizados por el listener), usarlos
    if (this.productsCache) {
      console.log("⚡ Using INSTANT cached products data")
      return this.productsCache
    }

    // Si no hay caché aún, hacer una consulta inicial
    try {
      console.log("🔍 Initial products fetch...")
      const querySnapshot = await getDocs(query(collection(db, "stock"), orderBy("name")))
      const products = querySnapshot.docs.map(transformDoc)

      this.productsCache = products
      this.notifyCacheUpdate()
      return products
    } catch (error) {
      console.error("❌ Error al obtener productos:", error)
      return []
    }
  }

  // Obtener producto por ID
  async getById(id: string): Promise<Product | null> {
    // Verificar si está en la caché en tiempo real
    if (this.productsCache) {
      const cachedProduct = this.productsCache.find((p) => p.id === id)
      if (cachedProduct) {
        console.log(`⚡ Using INSTANT cached data for product ${id}`)
        return cachedProduct
      }
    }

    try {
      const docRef = doc(db, "stock", id)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        return transformDoc(docSnap)
      } else {
        console.log("No se encontró el producto con ID:", id)
        return null
      }
    } catch (error) {
      console.error("Error al obtener producto por ID:", error)
      return null
    }
  }

  // Función de búsqueda
  async search(searchTerm: string, includeTags = false): Promise<Product[]> {
    try {
      // Usar la caché en tiempo real
      const allProducts = await this.getAll()

      if (!searchTerm || searchTerm.trim() === "") {
        return allProducts
      }

      const lowerCaseSearchTerm = searchTerm.toLowerCase().trim()

      return allProducts.filter((product) => {
        const nameMatch = product.name?.toLowerCase().includes(lowerCaseSearchTerm)
        const descriptionMatch = product.description?.toLowerCase().includes(lowerCaseSearchTerm)
        const brandMatch = product.brand?.toLowerCase().includes(lowerCaseSearchTerm)
        const modelMatch = product.model?.toLowerCase().includes(lowerCaseSearchTerm)

        return nameMatch || descriptionMatch || brandMatch || modelMatch
      })
    } catch (error) {
      console.error("Error en la búsqueda de productos:", error)
      return []
    }
  }

  // Guardar solo markdown
  async saveMarkdownOnly(id: string, markdown: string): Promise<boolean> {
    try {
      console.log(`📝 Guardando SOLO markdown para producto ${id}`)
      const docRef = doc(db, "stock", id)
      await setDoc(docRef, { markdownDescription: markdown }, { merge: true })
      console.log("✅ MARKDOWN GUARDADO EXITOSAMENTE")
      return true
    } catch (error) {
      console.error("❌ Error al guardar markdown:", error)
      return false
    }
  }

  // Actualizar producto (método añadido)
  async updateProduct(id: string, data: Partial<Product>): Promise<boolean> {
    try {
      console.log(`🔄 Actualizando producto ${id}`)
      const docRef = doc(db, "stock", id)
      const dataToUpdate = {
        ...data,
        lastManualUpdate: new Date().toISOString(), // Añadir timestamp de modificación manual
        updatedAt: serverTimestamp(),
      }
      // Upsert seguro: crea el doc si no existe
      await setDoc(docRef, dataToUpdate, { merge: true })
      console.log("✅ PRODUCTO ACTUALIZADO EXITOSAMENTE")

      // Best-effort mirror to Mongo API so SSR and /api/products reflect changes (incluye imágenes y flags)
      try {
        const payload: any = { id, ...data }
        // Ensure minimal fields commonly used by server renderers
        if (typeof (data as any)?.price === 'number') payload.price = (data as any).price
        if ((data as any)?.name) payload.name = (data as any).name
        if (Array.isArray((data as any)?.images)) payload.images = (data as any).images
        if ((data as any)?.image1 !== undefined) payload.image1 = (data as any).image1
        if ((data as any)?.image2 !== undefined) payload.image2 = (data as any).image2
        if ((data as any)?.image3 !== undefined) payload.image3 = (data as any).image3
        if ((data as any)?.image4 !== undefined) payload.image4 = (data as any).image4
        if ((data as any)?.image5 !== undefined) payload.image5 = (data as any).image5
        if ((data as any)?.category) payload.category = (data as any).category
        if ((data as any)?.categoryId) payload.categoryId = (data as any).categoryId
        if (typeof (data as any)?.points === 'number') payload.points = (data as any).points
        if (typeof (data as any)?.redeemPoints === 'number') payload.redeemPoints = (data as any).redeemPoints
        if ((data as any)?.isReward !== undefined) payload.isReward = Boolean((data as any).isReward)
        if ((data as any)?.liquidation !== undefined) payload.liquidation = Boolean((data as any).liquidation)
        if ((data as any)?.weeklyOffer !== undefined) payload.weeklyOffer = Boolean((data as any).weeklyOffer)
        await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(() => {})
      } catch {}
      return true
    } catch (error) {
      console.error("❌ Error al actualizar producto:", error)
      return false
    }
  }

  // Eliminar producto
  async deleteProduct(id: string): Promise<boolean> {
    try {
      console.log(`🗑️ Eliminando producto ${id}`)
      const docRef = doc(db, "stock", id)
      await deleteDoc(docRef)
      console.log("✅ PRODUCTO ELIMINADO EXITOSAMENTE")
      return true
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error)
      return false
    }
  }

  // Obtener productos por categoría
  async getByCategory(categoryId: string): Promise<Product[]> {
    try {
      // Usar la caché en tiempo real y filtrar
      const allProducts = await this.getAll()
      return allProducts.filter((product) => product.category === categoryId)
    } catch (error) {
      console.error("❌ Error al obtener productos por categoría:", error)
      return []
    }
  }

  // Obtener productos destacados
  async getFeatured(limit = 8): Promise<Product[]> {
    try {
      const allProducts = await this.getAll()
      return allProducts.filter((product) => product.price > 0 && product.image1).slice(0, limit)
    } catch (error) {
      console.error("❌ Error al obtener productos destacados:", error)
      return []
    }
  }

  // Limpiar listeners
  cleanup() {
    console.log("🧹 Cleaning up product listeners...")
    this.productListeners.forEach((unsubscribe) => unsubscribe())
    this.productListeners.clear()
    this.isListenerActive = false
    this.cacheCallbacks.clear()
  }
}

// Crear instancia singleton
const productServiceInstance = new ProductService()

// Exportar el servicio y funciones individuales
export const productService = productServiceInstance
export const getProductById = productServiceInstance.getById.bind(productServiceInstance)
export const getAllProducts = productServiceInstance.getAll.bind(productServiceInstance)
export const searchProducts = productServiceInstance.search.bind(productServiceInstance)
export const updateProductStock = productServiceInstance.updateStock.bind(productServiceInstance)
export const onProductsUpdate = productServiceInstance.onCacheUpdate.bind(productServiceInstance)
export const deleteProduct = productServiceInstance.deleteProduct.bind(productServiceInstance)
export const updateProduct = productServiceInstance.updateProduct.bind(productServiceInstance) // Exportar nuevo método
