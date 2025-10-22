import { connectToMongoDB } from "@/lib/mongoose"
import { Favorite as FavoriteModel } from "@/models/mongodb/Favorite"
import type { Favorite } from "@/models/Favorite"
import { getProductById } from "./productService"

// Obtener todos los favoritos de un usuario
export const getUserFavorites = async (userId: string, forceRefresh = false): Promise<Favorite[]> => {
  if (!userId) {
    console.log("No hay userId, devolviendo array vacío de favoritos")
    return []
  }

  console.log(`Obteniendo favoritos para el usuario ${userId} (forceRefresh: ${forceRefresh})`)
  try {
    await connectToMongoDB()
    
    const favorites = await FavoriteModel.find({ userId }).lean()
    console.log(`Encontrados ${favorites.length} favoritos en MongoDB`)

    const favoritesWithProducts: Favorite[] = []

    // Procesar cada favorito y obtener los detalles del producto
    for (const fav of favorites) {
      try {
        const product = await getProductById(fav.productId)

        if (product) {
          favoritesWithProducts.push({
            id: fav._id.toString(),
            userId: fav.userId,
            productId: fav.productId,
            createdAt: fav.createdAt || new Date(),
            product: product,
          })
        } else {
          console.warn(`Producto ${fav.productId} no encontrado para el favorito ${fav._id}`)
        }
      } catch (productError) {
        console.error(`Error al obtener producto ${fav.productId}:`, productError)
      }
    }

    console.log(`Procesados ${favoritesWithProducts.length} favoritos con productos válidos`)
    return favoritesWithProducts
  } catch (error) {
    console.error("Error al obtener favoritos del usuario:", error)
    return []
  }
}

// Añadir un producto a favoritos
export const addToFavorites = async (userId: string, productId: string): Promise<boolean> => {
  try {
    console.log(`Añadiendo producto ${productId} a favoritos para usuario ${userId}`)
    await connectToMongoDB()

    // Verificar si ya existe
    const existing = await FavoriteModel.findOne({ userId, productId })
    if (existing) {
      console.log("Producto ya está en favoritos")
      return true
    }

    // Crear nuevo favorito
    const favoriteId = `${userId}_${productId}`
    await FavoriteModel.create({
      _id: favoriteId,
      userId,
      productId,
      createdAt: new Date(),
    })

    console.log("Favorito guardado exitosamente en MongoDB")
    return true
  } catch (error) {
    console.error("Error al añadir a favoritos:", error)
    return false
  }
}

// Eliminar un producto de favoritos
export const removeFromFavorites = async (userId: string, productId: string): Promise<boolean> => {
  try {
    console.log(`Eliminando producto ${productId} de favoritos para usuario ${userId}`)
    await connectToMongoDB()

    const favoriteId = `${userId}_${productId}`
    await FavoriteModel.deleteOne({ _id: favoriteId })

    console.log("Favorito eliminado exitosamente de MongoDB")
    return true
  } catch (error) {
    console.error("Error al eliminar de favoritos:", error)
    return false
  }
}

// Verificar si un producto está en favoritos
export const isProductFavorite = async (userId: string, productId: string): Promise<boolean> => {
  try {
    await connectToMongoDB()
    
    const favorite = await FavoriteModel.findOne({ userId, productId })
    return !!favorite
  } catch (error) {
    console.error("Error checking if product is favorite:", error)
    return false
  }
}
