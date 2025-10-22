"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useFavorites } from "@/context/FavoritesContext"
import { useAuth } from "@/context/AuthContext"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trash2, ShoppingCart, ArrowLeft, Heart } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useToast } from "@/components/ui/use-toast"
import ProductImage from "@/components/product/ProductImage"

export default function FavoritesPage() {
  const { favorites, loading, error, removeFavorite, refreshFavorites } = useFavorites()
  const { user } = useAuth()
  const router = useRouter()
  const { addItem } = useCart()
  const { toast } = useToast()
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login?redirect=/favorites")
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      // Cargar favoritos desde Firebase al montar el componente
      refreshFavorites()
      console.log("Cargando favoritos desde Firebase para el usuario:", user.uid)
    } else {
      // Si no hay usuario, asegurarse de que no haya favoritos
      setIsRemoving({})
    }
  }, [user])

  const handleRemoveFavorite = async (productId: string) => {
    setIsRemoving((prev) => ({ ...prev, [productId]: true }))
    try {
      await removeFavorite(productId)
      // Actualizar UI inmediatamente
      toast({
        title: "Eliminado",
        description: "Producto eliminado de favoritos correctamente",
      })
      // Recargar favoritos desde Firebase para asegurar sincronización
      setTimeout(() => refreshFavorites(), 500)
    } catch (error) {
      console.error("Error al eliminar favorito:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el favorito. Intente nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsRemoving((prev) => ({ ...prev, [productId]: false }))
    }
  }

  const handleAddToCart = (product: any) => {
    if (addItem) {
      addItem(product)
      toast({
        title: "Añadido al carrito",
        description: `${product.name} añadido al carrito correctamente`,
      })
    }
  }

  if (loading) {
    return (
      <div className="container py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-t-red-500 border-b-red-700 rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Cargando tus favoritos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-12 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4">Ocurrió un error</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <Button onClick={() => refreshFavorites()}>Intentar nuevamente</Button>
        </div>
      </div>
    )
  }

  console.log("Renderizando favoritos:", favorites.length, "items")
  return (
    <div className="container py-8 md:py-12">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="h-10 w-10 rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold">Mis Favoritos</h1>
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="bg-red-50 dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
            <Heart className="h-12 w-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-3">No tienes favoritos todavía</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-sm mx-auto">
            Guarda tus productos favoritos para encontrarlos fácilmente más tarde y recibir notificaciones sobre ofertas
            especiales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => router.push("/products")} className="bg-red-600 hover:bg-red-700" size="lg">
              <ShoppingCart className="mr-2 h-5 w-5" />
              Explorar productos
            </Button>
            <Button onClick={() => router.push("/categories")} variant="outline" size="lg">
              Ver categorías
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favorites.map(
            (favorite) =>
              favorite.product && (
                <Card key={favorite.id} className="overflow-hidden group hover:shadow-lg transition-all duration-300">
                  <div className="relative">
                    <div className="cursor-pointer" onClick={() => router.push(`/products/${favorite.product?.id}`)}>
                      <ProductImage
                        product={favorite.product}
                        imageUrl={favorite.product.image1}
                        className="w-full aspect-[3/2] object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      onClick={() => handleRemoveFavorite(favorite.productId)}
                      disabled={isRemoving[favorite.productId]}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardContent className="p-4">
                    {favorite.product ? (
                      <div
                        className="cursor-pointer mb-4"
                        onClick={() => router.push(`/products/${favorite.product?.id}`)}
                      >
                        <h3 className="font-medium line-clamp-1 text-lg mb-1">
                          {favorite.product.name || "Producto sin nombre"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                          {favorite.product.description || "Sin descripción"}
                        </p>
                        <p className="font-bold text-lg">
                          {favorite.product.price || "0"} {favorite.product.currency || "USD"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Añadido el: {new Date(favorite.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ) : (
                      <div className="mb-4 text-center py-2">
                        <p className="text-sm text-gray-500">Producto no disponible</p>
                      </div>
                    )}

                    <Button
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={() => favorite.product && handleAddToCart(favorite.product)}
                      disabled={!favorite.product?.isInStock}
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      {favorite.product?.isInStock ? "Añadir al carrito" : "Agotado"}
                    </Button>
                  </CardContent>
                </Card>
              ),
          )}
        </div>
      )}
    </div>
  )
}
