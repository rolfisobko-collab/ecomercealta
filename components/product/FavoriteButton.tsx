"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { useFavorites } from "@/context/FavoritesContext"
import { useAuth } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface FavoriteButtonProps {
  productId: string
  size?: "default" | "sm" | "lg"
  className?: string
}

export function FavoriteButton({ productId, size = "default", className = "" }: FavoriteButtonProps) {
  const { isFavorite, addFavorite, removeFavorite } = useFavorites()
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [isActive, setIsActive] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Verificar estado inicial desde el contexto
    setIsActive(isFavorite(productId))

    // Añadir logs para depuración
    console.log(`Producto ${productId} es favorito:`, isFavorite(productId))
  }, [productId, isFavorite])

  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para guardar favoritos",
        variant: "destructive",
      })
      router.push("/auth/login?redirect=/favorites")
      return
    }

    setIsLoading(true)
    try {
      console.log(
        `Intentando ${isActive ? "eliminar" : "añadir"} favorito para producto ${productId} y usuario ${user.uid}`,
      )

      if (isActive) {
        await removeFavorite(productId)
        setIsActive(false)
        toast({
          title: "Eliminado",
          description: "Producto eliminado de favoritos",
        })
        console.log(`Favorito eliminado correctamente en Firebase: ${productId}`)
      } else {
        await addFavorite(productId)
        setIsActive(true)
        toast({
          title: "Guardado",
          description: "Producto añadido a favoritos",
        })
        console.log(`Favorito guardado correctamente en Firebase: ${productId}`)
      }
    } catch (error) {
      console.error("Error al actualizar favorito en Firebase:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el favorito",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const sizeClasses = {
    default: "h-8 w-8",
    sm: "h-7 w-7",
    lg: "h-10 w-10",
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`rounded-full bg-white/90 hover:bg-white shadow-md hover:shadow-lg dark:bg-gray-800/90 dark:hover:bg-gray-800 ${sizeClasses[size]} ${className} relative overflow-hidden transition-all duration-300 border border-gray-100 dark:border-gray-700`}
      onClick={handleToggleFavorite}
      disabled={isLoading}
      aria-label={isActive ? "Eliminar de favoritos" : "Añadir a favoritos"}
    >
      {isLoading && (
        <span className="absolute inset-0 flex items-center justify-center bg-white/90 dark:bg-gray-800/90 z-10">
          <svg
            className="animate-spin h-4 w-4 text-red-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </span>
      )}
      <Heart
        className={`h-4 w-4 ${isActive ? "fill-red-500 text-red-500" : "text-gray-700 dark:text-gray-300"} transition-all duration-300 ${isActive ? "scale-110" : "scale-100"}`}
      />
      <span className="sr-only">{isActive ? "Eliminar de favoritos" : "Añadir a favoritos"}</span>
    </Button>
  )
}
