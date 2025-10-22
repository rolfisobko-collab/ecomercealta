"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { Favorite } from "@/models/Favorite"
import { useAuth } from "./AuthContext"
import { getUserFavorites, addToFavorites, removeFromFavorites } from "@/services/hybrid/favoriteService"
import { useToast } from "@/components/ui/use-toast"

interface FavoritesContextType {
  favorites: Favorite[]
  loading: boolean
  error: string | null
  addFavorite: (productId: string) => Promise<void>
  removeFavorite: (productId: string) => Promise<void>
  isFavorite: (productId: string) => boolean
  refreshFavorites: () => Promise<void>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { toast } = useToast()

  const fetchFavorites = async () => {
    if (!user) {
      setFavorites([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const userFavorites = await getUserFavorites(user.uid)
      setFavorites(userFavorites)
    } catch (err) {
      console.error("Error fetching favorites:", err)
      setError("No se pudieron cargar los favoritos")
      toast({
        title: "Error",
        description: "No se pudieron cargar los favoritos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFavorites()
  }, [user])

  const addFavorite = async (productId: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para añadir favoritos",
        variant: "destructive",
      })
      return
    }

    try {
      await addToFavorites(user.uid, productId)
      await fetchFavorites() // Refrescar la lista
      toast({
        title: "Añadido a favoritos",
        description: "El producto se ha añadido a tus favoritos",
      })
    } catch (err) {
      console.error("Error adding favorite:", err)
      toast({
        title: "Error",
        description: "No se pudo añadir a favoritos",
        variant: "destructive",
      })
    }
  }

  const removeFavorite = async (productId: string) => {
    if (!user) return

    try {
      await removeFromFavorites(user.uid, productId)
      // Actualizar el estado local sin necesidad de recargar
      setFavorites(favorites.filter((fav) => fav.productId !== productId))
      toast({
        title: "Eliminado de favoritos",
        description: "El producto se ha eliminado de tus favoritos",
      })
    } catch (err) {
      console.error("Error removing favorite:", err)
      toast({
        title: "Error",
        description: "No se pudo eliminar de favoritos",
        variant: "destructive",
      })
    }
  }

  const isFavorite = (productId: string): boolean => {
    return favorites.some((fav) => fav.productId === productId)
  }

  const refreshFavorites = async () => {
    if (!user) {
      // Si no hay usuario, limpiar los favoritos
      setFavorites([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log("Actualizando favoritos desde Firebase...")
      // Obtener favoritos directamente desde Firebase, sin caché
      const userFavorites = await getUserFavorites(user.uid, true)
      setFavorites(userFavorites)
      console.log(`Favoritos actualizados: ${userFavorites.length} items`)
    } catch (err) {
      console.error("Error al actualizar favoritos:", err)
      // Asegurarse de que no haya datos hardcodeados en caso de error
      setFavorites([])
      toast({
        title: "Error",
        description: "No se pudieron actualizar los favoritos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        loading,
        error,
        addFavorite,
        removeFavorite,
        isFavorite,
        refreshFavorites,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  )
}

export const useFavorites = () => {
  const context = useContext(FavoritesContext)
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
