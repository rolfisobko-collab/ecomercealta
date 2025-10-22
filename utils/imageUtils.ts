import { storage } from "@/lib/firebase"
import { ref, getDownloadURL, listAll } from "firebase/storage"

// Add a client-side cache for image URLs
const imageCache: Record<string, { url: string; timestamp: number }> = {}

// Add this function to check the cache
export function getFromImageCache(key: string): string | null {
  const cacheEntry = imageCache[key]

  // If entry exists and is less than 5 minutes old
  if (cacheEntry && Date.now() - cacheEntry.timestamp < 300000) {
    console.log(`Using cached image for ${key}`)
    return cacheEntry.url
  }

  return null
}

// Add this function to save to cache
export function saveToImageCache(key: string, url: string): void {
  imageCache[key] = {
    url,
    timestamp: Date.now(),
  }
}

// Función para obtener la URL de la imagen de un producto
export async function getProductImageUrl(productId: string, productName: string): Promise<string | null> {
  // Check cache first
  const cacheKey = `product_${productId}`
  const cachedUrl = getFromImageCache(cacheKey)
  if (cachedUrl) return cachedUrl

  // Existing code...
  try {
    const imagesRef = ref(storage, `stock/${productId}/images`)
    const imagesList = await listAll(imagesRef)

    // Si hay imágenes en la carpeta, usar la primera
    if (imagesList.items.length > 0) {
      const url = await getDownloadURL(imagesList.items[0])
      saveToImageCache(cacheKey, url)
      return url
    }
  } catch (err) {
    console.log(`No se encontraron imágenes en stock/${productId}/images/`)
  }

  // Si no encontramos imágenes en la estructura principal, intentamos con las rutas alternativas
  const normalizedName = productName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")

  const paths = [
    `products/${productId}.jpg`,
    `products/${productId}.png`,
    `products/${normalizedName}.jpg`,
    `products/${normalizedName}.png`,
    `${productId}.jpg`,
    `${productId}.png`,
    `${normalizedName}.jpg`,
    `${normalizedName}.png`,
  ]

  for (const path of paths) {
    try {
      const imageRef = ref(storage, path)
      const url = await getDownloadURL(imageRef)
      saveToImageCache(cacheKey, url)
      return url
    } catch (err) {
      // Continuar con la siguiente ruta si esta falla
      console.log(`No se encontró imagen en: ${path}`)
    }
  }

  return null
}

// Modify batchLoadProductImages to use cache
export async function batchLoadProductImages(
  products: Array<{ id: string; name: string }>,
): Promise<Record<string, string>> {
  const results: Record<string, string> = {}

  // Check cache first for all products
  products.forEach((product) => {
    const cacheKey = `product_${product.id}`
    const cachedUrl = getFromImageCache(cacheKey)
    if (cachedUrl) {
      results[product.id] = cachedUrl
    }
  })

  // Filter out products that were found in cache
  const uncachedProducts = products.filter((product) => !results[product.id])

  // Procesar en lotes de 5 para evitar demasiadas operaciones concurrentes
  for (let i = 0; i < uncachedProducts.length; i += 5) {
    const batch = uncachedProducts.slice(i, i + 5)

    await Promise.all(
      batch.map(async (product) => {
        try {
          const imageUrl = await getProductImageUrl(product.id, product.name)
          if (imageUrl) {
            results[product.id] = imageUrl
          }
        } catch (err) {
          console.error(`Error loading image for product ${product.id}:`, err)
        }
      }),
    )
  }

  return results
}
