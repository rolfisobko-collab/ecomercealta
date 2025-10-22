import { getDatabaseProvider } from "@/lib/database-config"
import type { Favorite } from "@/models/Favorite"

// Servicio híbrido que usa API routes (MongoDB) en el navegador o servidor
export async function getUserFavorites(userId: string, forceRefresh = false): Promise<Favorite[]> {
  const provider = getDatabaseProvider()
  
  // En el navegador o cuando se usa MongoDB, usar API routes
  if (typeof window !== 'undefined' || provider === 'mongodb') {
    try {
      const response = await fetch(`/api/favorites?userId=${encodeURIComponent(userId)}`)
      if (!response.ok) return []
      return await response.json()
    } catch (error) {
      console.error('Error fetching favorites:', error)
      return []
    }
  } else {
    const firebaseFavoriteService = await import("../api/favoriteService")
    return await firebaseFavoriteService.getUserFavorites(userId, forceRefresh)
  }
}

export async function addToFavorites(userId: string, productId: string): Promise<boolean> {
  const provider = getDatabaseProvider()
  
  // En el navegador o cuando se usa MongoDB, usar API routes
  if (typeof window !== 'undefined' || provider === 'mongodb') {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, productId })
      })
      if (!response.ok) return false
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error adding to favorites:', error)
      return false
    }
  } else {
    const firebaseFavoriteService = await import("../api/favoriteService")
    return await firebaseFavoriteService.addToFavorites(userId, productId)
  }
}

export async function removeFromFavorites(userId: string, productId: string): Promise<boolean> {
  const provider = getDatabaseProvider()
  
  // En el navegador o cuando se usa MongoDB, usar API routes
  if (typeof window !== 'undefined' || provider === 'mongodb') {
    try {
      const response = await fetch(`/api/favorites?userId=${encodeURIComponent(userId)}&productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE'
      })
      if (!response.ok) return false
      const data = await response.json()
      return data.success
    } catch (error) {
      console.error('Error removing from favorites:', error)
      return false
    }
  } else {
    const firebaseFavoriteService = await import("../api/favoriteService")
    return await firebaseFavoriteService.removeFromFavorites(userId, productId)
  }
}

export async function isProductFavorite(userId: string, productId: string): Promise<boolean> {
  const provider = getDatabaseProvider()
  
  // En el navegador o cuando se usa MongoDB, usar API routes
  if (typeof window !== 'undefined' || provider === 'mongodb') {
    try {
      const favorites = await getUserFavorites(userId)
      return favorites.some(fav => fav.productId === productId)
    } catch (error) {
      console.error('Error checking if product is favorite:', error)
      return false
    }
  } else {
    const firebaseFavoriteService = await import("../api/favoriteService")
    return await firebaseFavoriteService.isProductFavorite(userId, productId)
  }
}
