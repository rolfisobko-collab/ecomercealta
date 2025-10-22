import { db } from "@/lib/firebase"
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, query, where, serverTimestamp } from "firebase/firestore"
import type { Favorite } from "@/models/Favorite"
import { getProductById } from "./productService"

const FAVORITES_COLLECTION = "favorites"

// Obtener todos los favoritos de un usuario
export const getUserFavorites = async (userId: string, forceRefresh = false): Promise<Favorite[]> => {
  // Si no hay userId, devolver array vacío
  if (!userId) {
    console.log("No hay userId, devolviendo array vacío de favoritos")
    return []
  }

  console.log(`Obteniendo favoritos para el usuario ${userId} (forceRefresh: ${forceRefresh})`)
  try {
    console.log("Obteniendo favoritos para usuario:", userId)
    const favoritesRef = collection(db, FAVORITES_COLLECTION)
    const q = query(favoritesRef, where("userId", "==", userId))
    const querySnapshot = await getDocs(q)

    console.log(`Encontrados ${querySnapshot.size} favoritos en Firebase`)

    const favorites: Favorite[] = []

    // Procesar cada documento y obtener los detalles del producto
    for (const docSnapshot of querySnapshot.docs) {
      const data = docSnapshot.data()
      const productId = data.productId

      try {
        // Obtener los detalles del producto
        const product = await getProductById(productId)

        if (product) {
          favorites.push({
            id: docSnapshot.id,
            userId: data.userId,
            productId: data.productId,
            createdAt: data.createdAt?.toDate() || new Date(),
            product: product,
          })
        } else {
          console.warn(`Producto ${productId} no encontrado para el favorito ${docSnapshot.id}`)
        }
      } catch (productError) {
        console.error(`Error al obtener producto ${productId}:`, productError)
      }
    }

    console.log(`Procesados ${favorites.length} favoritos con productos válidos`)
    return favorites
  } catch (error) {
    console.error("Error al obtener favoritos del usuario:", error)
    return []
  }
}

// Añadir un producto a favoritos
export const addToFavorites = async (userId: string, productId: string): Promise<boolean> => {
  try {
    console.log(`Añadiendo producto ${productId} a favoritos para usuario ${userId}`)

    // Verificar si ya existe
    if (await isProductFavorite(userId, productId)) {
      console.log("Producto ya está en favoritos")
      return true
    }

    // Crear un ID único para el documento
    const favoriteId = `${userId}_${productId}`
    const favoriteRef = doc(db, FAVORITES_COLLECTION, favoriteId)

    await setDoc(favoriteRef, {
      userId,
      productId,
      createdAt: serverTimestamp(),
    })

    console.log("Favorito guardado exitosamente en Firebase")
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

    const favoriteId = `${userId}_${productId}`
    const favoriteRef = doc(db, FAVORITES_COLLECTION, favoriteId)

    await deleteDoc(favoriteRef)
    console.log("Favorito eliminado exitosamente de Firebase")
    return true
  } catch (error) {
    console.error("Error al eliminar de favoritos:", error)
    return false
  }
}

// Verificar si un producto está en favoritos
export const isProductFavorite = async (userId: string, productId: string): Promise<boolean> => {
  try {
    const favoriteId = `${userId}_${productId}`
    const favoriteRef = doc(db, FAVORITES_COLLECTION, favoriteId)
    const docSnap = await getDoc(favoriteRef)

    return docSnap.exists()
  } catch (error) {
    console.error("Error checking if product is favorite:", error)
    return false
  }
}
