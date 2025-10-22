import { connectToMongoDB } from "@/lib/mongoose"
import { Product } from "@/models/mongodb/Product"
import type { Product as ProductType } from "@/models/Product"

// Función para transformar un documento de MongoDB en un objeto Product
const transformDoc = (doc: any): ProductType => {
  return {
    id: doc._id.toString(),
    name: doc.name || "",
    description: doc.description || "",
    markdownDescription: doc.markdownDescription || "",
    price: doc.price || 0,
    cost: doc.cost || 0,
    currency: doc.currency || "USD",
    quantity: doc.quantity || 0,
    category: doc.category || "",
    location: doc.location || "",
    obs: doc.obs || "",
    createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: doc.updatedAt?.toISOString() || new Date().toISOString(),
    lastManualUpdate: doc.lastManualUpdate?.toISOString() || null,
    images: doc.images || [],
    image1: doc.image1 || "",
    image2: doc.image2 || "",
    image3: doc.image3 || "",
    image4: doc.image4 || "",
    image5: doc.image5 || "",
    youtubeVideoId: doc.youtubeVideoId || null,
    youtubeUrl: doc.youtubeUrl || "",
    isInStock: doc.isInStock || doc.quantity > 0,
    brand: doc.brand || "",
    model: doc.model || "",
    discount: doc.discount || 0,
  }
}

class ProductService {
  private productsCache: ProductType[] | null = null
  private productListeners: Map<string, () => void> = new Map()
  private isListenerActive = false
  private cacheCallbacks: Set<(products: ProductType[]) => void> = new Set()

  constructor() {
    this.setupProductsListener()
  }

  // Método para suscribirse a cambios de caché en tiempo real
  onCacheUpdate(callback: (products: ProductType[]) => void) {
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

  private async setupProductsListener() {
    if (this.isListenerActive) return

    try {
      await connectToMongoDB()
      // MongoDB no tiene listeners en tiempo real como Firebase, 
      // pero podemos implementar polling o usar MongoDB Change Streams
      this.isListenerActive = true
      console.log("🎧 Products service initialized")
    } catch (error) {
      console.error("❌ Error setting up products listener:", error)
    }
  }

  // Método para actualizar stock
  async updateStock(productId: string, newQuantity: number): Promise<boolean> {
    try {
      console.log(`⚡ Updating stock for ${productId}: ${newQuantity}`)

      await connectToMongoDB()
      await Product.findByIdAndUpdate(productId, {
        quantity: Math.max(0, newQuantity),
        isInStock: newQuantity > 0,
        updatedAt: new Date(),
      })

      // Actualizar la caché local
      if (this.productsCache) {
        const productIndex = this.productsCache.findIndex((p) => p.id === productId)
        if (productIndex !== -1) {
          this.productsCache[productIndex].quantity = Math.max(0, newQuantity)
          this.productsCache[productIndex].isInStock = newQuantity > 0

          // Notificar cambio
          this.notifyCacheUpdate()
          console.log(`⚡ Local cache updated for ${productId}`)
        }
      }

      return true
    } catch (error) {
      console.error("❌ Error updating stock:", error)
      return false
    }
  }

  // Obtener todos los productos
  async getAll(): Promise<ProductType[]> {
    // Si ya tenemos datos en caché, usarlos
    if (this.productsCache) {
      console.log("⚡ Using cached products data")
      return this.productsCache
    }

    // Si no hay caché aún, hacer una consulta inicial
    try {
      console.log("🔍 Initial products fetch...")
      await connectToMongoDB()
      const products = await Product.find({}).sort({ name: 1 })
      const transformedProducts = products.map(transformDoc)

      this.productsCache = transformedProducts
      this.notifyCacheUpdate()
      return transformedProducts
    } catch (error) {
      console.error("❌ Error al obtener productos:", error)
      return []
    }
  }

  // Obtener producto por ID
  async getById(id: string): Promise<ProductType | null> {
    // Verificar si está en la caché
    if (this.productsCache) {
      const cachedProduct = this.productsCache.find((p) => p.id === id)
      if (cachedProduct) {
        console.log(`⚡ Using cached data for product ${id}`)
        return cachedProduct
      }
    }

    try {
      await connectToMongoDB()
      const product = await Product.findOne({ _id: id })
      if (product) {
        return transformDoc(product)
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
  async search(searchTerm: string, includeTags = false): Promise<ProductType[]> {
    try {
      // Usar la caché
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
      await connectToMongoDB()
      await Product.findByIdAndUpdate(id, { 
        markdownDescription: markdown,
        updatedAt: new Date()
      })
      console.log("✅ MARKDOWN GUARDADO EXITOSAMENTE")
      return true
    } catch (error) {
      console.error("❌ Error al guardar markdown:", error)
      return false
    }
  }

  // Actualizar producto
  async updateProduct(id: string, data: Partial<ProductType>): Promise<boolean> {
    try {
      console.log(`🔄 Actualizando producto ${id}`)
      await connectToMongoDB()
      const dataToUpdate = {
        ...data,
        lastManualUpdate: new Date(),
        updatedAt: new Date(),
      }
      await Product.findByIdAndUpdate(id, dataToUpdate)
      console.log("✅ PRODUCTO ACTUALIZADO EXITOSAMENTE")
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
      await connectToMongoDB()
      await Product.findByIdAndDelete(id)
      console.log("✅ PRODUCTO ELIMINADO EXITOSAMENTE")
      return true
    } catch (error) {
      console.error("❌ Error al eliminar producto:", error)
      return false
    }
  }

  // Obtener productos por categoría
  async getByCategory(categoryId: string): Promise<ProductType[]> {
    try {
      // Usar la caché y filtrar
      const allProducts = await this.getAll()
      return allProducts.filter((product) => product.category === categoryId)
    } catch (error) {
      console.error("❌ Error al obtener productos por categoría:", error)
      return []
    }
  }

  // Obtener productos destacados
  async getFeatured(limit = 8): Promise<ProductType[]> {
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
export const updateProduct = productServiceInstance.updateProduct.bind(productServiceInstance)

