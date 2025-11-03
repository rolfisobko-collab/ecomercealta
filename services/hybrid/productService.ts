import { getDatabaseProvider } from "@/lib/database-config"
import type { Product } from "@/models/Product"

// Servicio híbrido que usa API routes (MongoDB) en el navegador o servidor
export async function getProductById(id: string): Promise<Product | null> {
  const provider = getDatabaseProvider()
  
  // En el navegador o cuando se usa MongoDB, usar API routes
  if (typeof window !== 'undefined' || provider === 'mongodb') {
    try {
      const response = await fetch(`/api/products/${id}`)
      if (!response.ok) return null
      return await response.json()
    } catch (error) {
      console.error('Error fetching product:', error)
      return null
    }
  } else {
    const firebaseProductService = await import("../api/productService")
    return await firebaseProductService.getProductById(id)
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const provider = getDatabaseProvider()
  
  // En el navegador o cuando se usa MongoDB, usar API routes
  if (typeof window !== 'undefined' || provider === 'mongodb') {
    try {
      // Solicitar un límite alto para evitar la restricción por defecto (50)
      const response = await fetch('/api/products?limit=100000')
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Error fetching products:', error)
      return []
    }
  } else {
    const firebaseProductService = await import("../api/productService")
    return await firebaseProductService.getAllProducts()
  }
}

export async function searchProducts(searchTerm: string, includeTags = false): Promise<Product[]> {
  const provider = getDatabaseProvider()
  
  // En el navegador o cuando se usa MongoDB, usar API routes
  if (typeof window !== 'undefined' || provider === 'mongodb') {
    try {
      const response = await fetch(`/api/products?q=${encodeURIComponent(searchTerm)}`)
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Error searching products:', error)
      return []
    }
  } else {
    const firebaseProductService = await import("../api/productService")
    return await firebaseProductService.searchProducts(searchTerm, includeTags)
  }
}

export async function updateProductStock(
  productId: string,
  newQuantity: number,
  meta?: { name?: string; brand?: string; categoryId?: string; price?: number }
): Promise<boolean> {
  const provider = getDatabaseProvider()
  // On the client, always use API to avoid loading server-only modules (prevents ChunkLoadError)
  if (typeof window !== 'undefined' || provider === 'mongodb') {
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: productId,
          _id: productId,
          // Write both fields to support different schemas
          quantity: Math.max(0, newQuantity),
          stock: Math.max(0, newQuantity),
          isInStock: newQuantity > 0,
          // Helpful metadata for server-side matching fallbacks
          name: meta?.name,
          brand: meta?.brand,
          categoryId: meta?.categoryId,
          price: meta?.price,
        }),
      })
      return res.ok
    } catch (e) {
      console.error('Error updating stock via API:', e)
      return false
    }
  } else {
    const firebaseProductService = await import("../api/productService")
    return await firebaseProductService.updateProductStock(productId, newQuantity)
  }
}

export async function onProductsUpdate(callback: (products: Product[]) => void) {
  const provider = getDatabaseProvider()
  // In the browser, avoid importing MongoDB service (uses mongoose) and poll API instead
  if (typeof window !== 'undefined') {
    let active = true
    let intervalId: number | undefined
    const poll = async () => {
      try {
        const res = await fetch('/api/products')
        if (!res.ok) return
        const data = await res.json()
        if (active) callback(data)
      } catch {}
    }
    // immediate fetch
    poll()
    // poll every 5s
    intervalId = window.setInterval(poll, 5000)
    // unsubscribe
    return () => {
      active = false
      if (intervalId) window.clearInterval(intervalId)
    }
  }

  if (provider === 'mongodb') {
    const mongodbProductService = await import("../mongodb/productService")
    return mongodbProductService.onProductsUpdate(callback)
  } else {
    const firebaseProductService = await import("../api/productService")
    return await firebaseProductService.onProductsUpdate(callback)
  }
}

export async function deleteProduct(id: string): Promise<boolean> {
  const provider = getDatabaseProvider()
  if (provider === 'mongodb') {
    const mongodbProductService = await import("../mongodb/productService")
    return await mongodbProductService.deleteProduct(id)
  } else {
    const firebaseProductService = await import("../api/productService")
    return await firebaseProductService.deleteProduct(id)
  }
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<boolean> {
  const provider = getDatabaseProvider()
  // En el navegador, siempre usar servicio API para evitar importar Mongoose
  if (typeof window !== 'undefined') {
    const firebaseProductService = await import("../api/productService")
    return await firebaseProductService.updateProduct(id, data as any)
  }
  if (provider === 'mongodb') {
    const mongodbProductService = await import("../mongodb/productService")
    return await mongodbProductService.updateProduct(id, data)
  } else {
    const firebaseProductService = await import("../api/productService")
    return await firebaseProductService.updateProduct(id, data)
  }
}

// Exportar el servicio completo para compatibilidad
export const productService = {
  getById: getProductById,
  getAll: getAllProducts,
  search: searchProducts,
  updateStock: updateProductStock,
  onCacheUpdate: onProductsUpdate,
  deleteProduct,
  updateProduct,
  cleanup: async () => {
    const provider = getDatabaseProvider()
    if (provider === 'mongodb') {
      const mongodbProductService = await import("../mongodb/productService")
      mongodbProductService.productService.cleanup()
    } else {
      const firebaseProductService = await import("../api/productService")
      firebaseProductService.productService.cleanup()
    }
  }
}

