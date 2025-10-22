"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ShoppingCart, ArrowLeft, Share2, ChevronRight, Check, Truck, Shield, RefreshCw } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useCart } from "@/context/CartContext"
import type { Product } from "@/models/Product"
import ProductImage from "@/components/product/ProductImage"
import { productService } from "@/services/hybrid/productService"
import { FavoriteButton } from "@/components/product/FavoriteButton"
import { categoryService } from "@/services/hybrid/categoryService"
import ProductCard from "@/components/product/ProductCard"
import ReactMarkdown from "react-markdown"

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState<string>("No especificada")
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loadingRelated, setLoadingRelated] = useState(true)

  const router = useRouter()
  const { addItem } = useCart()
  const { toast } = useToast()
  const { id } = use(params)

  // Scroll to top on component mount
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/products/${id}`)
        const productData = res.ok ? ((await res.json()) as Product) : null
        if (productData) {
          setProduct(productData)
          setActiveImage(productData.image1 || null)

          // Obtener el nombre de la categoría
          if (productData.category) {
            try {
              const category = await categoryService.getById(productData.category)
              if (category) {
                setCategoryName(category.name)
              }
            } catch (err) {
              console.error("Error al obtener categoría:", err)
              setCategoryName("No especificada")
            }
          }

          // Cargar productos relacionados de forma simple
          try {
            const allProducts = await productService.getAll()
            const filtered = allProducts.filter((p) => p.id !== productData.id && p.price > 0 && p.image1).slice(0, 4)
            setRelatedProducts(filtered)
          } catch (err) {
            console.error("Error al cargar productos relacionados:", err)
            setRelatedProducts([])
          } finally {
            setLoadingRelated(false)
          }
        } else {
          setError("Producto no encontrado")
        }
      } catch (err) {
        console.error("Error fetching product:", err)
        setError("Error al cargar el producto")
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  const handleAddToCart = () => {
    if (product && addItem) {
      // Añadir la cantidad seleccionada del producto
      for (let i = 0; i < quantity; i++) {
        addItem(product)
      }

      toast({
        title: "Añadido al carrito",
        description: `${quantity} ${quantity > 1 ? "unidades" : "unidad"} de ${product.name} ${quantity > 1 ? "añadidas" : "añadida"} al carrito`,
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share && window.location.href) {
      try {
        await navigator.share({
          title: product?.name || "Producto",
          text: product?.description || "Mira este producto",
          url: window.location.href,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    } else {
      // Fallback para navegadores que no soportan Web Share API
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Enlace copiado",
        description: "El enlace del producto ha sido copiado al portapapeles",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-t-4 border-red-600 border-solid rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-t-4 border-red-400 border-solid rounded-full animate-spin animation-delay-150"></div>
          <div className="absolute inset-4 border-t-4 border-red-200 border-solid rounded-full animate-spin animation-delay-300"></div>
        </div>
        <p className="mt-8 text-xl font-light tracking-wide text-gray-600 dark:text-gray-300">Cargando producto...</p>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4">Producto no encontrado</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8">
            {error || "No se pudo encontrar el producto solicitado"}
          </p>
          <Button
            onClick={() => router.push("/products")}
            className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-8 py-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            Ver todos los productos
          </Button>
        </div>
      </div>
    )
  }

  const productImages = [product.image1, product.image2, product.image3, product.image4].filter(Boolean) as string[]

  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-black min-h-screen">
      {/* Breadcrumb navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <nav className="flex items-center space-x-1 text-sm font-medium text-gray-500 dark:text-gray-400">
          <button
            onClick={() => router.push("/")}
            className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Inicio
          </button>
          <ChevronRight className="h-4 w-4" />
          <button
            onClick={() => router.push("/search")}
            className="hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Productos
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 dark:text-gray-200 truncate max-w-[200px]">{product.name}</span>
        </nav>
      </div>

      {/* Back button */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </button>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Product gallery */}
            <div className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 p-6 lg:p-10">
              {/* Main image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white dark:bg-gray-900 shadow-lg mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/30 to-transparent dark:from-gray-800/30 z-0"></div>
                <ProductImage
                  product={product}
                  imageUrl={activeImage || product.image1}
                  className="w-full h-full object-contain p-6 z-10 relative transition-all duration-500 hover:scale-105"
                  enableZoom={true} // Activar zoom solo en la página de detalle
                />

                {/* Discount badge */}
                {product.discount > 0 && (
                  <div className="absolute top-4 left-4 bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-2 rounded-full font-medium shadow-lg z-20">
                    {product.discount}% OFF
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-4">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      className={`aspect-square rounded-xl overflow-hidden transition-all duration-300 ${
                        activeImage === image
                          ? "ring-2 ring-red-500 ring-offset-2 dark:ring-offset-gray-800 shadow-md"
                          : "opacity-70 hover:opacity-100 hover:shadow-md"
                      }`}
                      onClick={() => setActiveImage(image)}
                    >
                      <ProductImage product={product} imageUrl={image} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="p-6 lg:p-10 flex flex-col h-full">
              {/* Product header */}
              <div className="mb-8">
                <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                  {product.name}
                </h1>

                <div className="flex flex-wrap items-center gap-4 mb-6">
                  {product.brand && (
                    <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium">
                      {product.brand}
                    </div>
                  )}

                  {product.model && (
                    <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium">
                      {product.model}
                    </div>
                  )}

                  <div className="px-4 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm font-medium">
                    {categoryName}
                  </div>

                  {product.quantity > 0 ? (
                    <div className="flex items-center px-4 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      En stock
                    </div>
                  ) : (
                    <div className="flex items-center px-4 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full text-sm font-medium">
                      <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                      Agotado
                    </div>
                  )}
                </div>

                <div className="flex items-baseline">
                  <span className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white">
                    {product.price} {product.currency}
                  </span>

                  {product.discount > 0 && (
                    <span className="ml-4 text-xl text-gray-500 dark:text-gray-400 line-through">
                      {Math.round(product.price / (1 - product.discount / 100))} {product.currency}
                    </span>
                  )}
                </div>
              </div>

              {/* Product description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3 text-gray-900 dark:text-white">Descripción</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{product.description}</p>
              </div>

              {/* Quantity selector */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Cantidad</h2>
                <div className="inline-flex items-center bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="h-12 w-12 rounded-full hover:bg-white dark:hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-xl font-medium">-</span>
                  </Button>
                  <span className="mx-6 text-2xl font-medium w-8 text-center">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={product.quantity <= 0}
                    className="h-12 w-12 rounded-full hover:bg-white dark:hover:bg-gray-600 transition-colors"
                  >
                    <span className="text-xl font-medium">+</span>
                  </Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col gap-4">
                <Button
                  className={`w-full py-8 text-lg font-medium rounded-xl shadow-xl transition-all duration-300 ${
                    product.quantity > 0
                      ? "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white hover:shadow-2xl hover:shadow-red-600/20"
                      : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  }`}
                  onClick={handleAddToCart}
                  disabled={product.quantity <= 0}
                >
                  <ShoppingCart className="mr-3 h-6 w-6" />
                  {product.quantity > 0 ? "Añadir al carrito" : "Agotado"}
                </Button>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant="outline"
                    onClick={handleShare}
                    className="flex-1 h-14 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border-0 shadow-md"
                  >
                    <Share2 className="mr-2 h-5 w-5" />
                    Compartir
                  </Button>

                  <div className="flex-1">
                    <FavoriteButton
                      productId={product.id}
                      size="lg"
                      className="w-full h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center transform transition-transform hover:scale-105">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Garantía de 1 mes</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Todos nuestros productos incluyen garantía oficial.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30 flex items-center justify-center transform transition-transform hover:scale-105">
                    <Truck className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Envío rápido</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Entrega en 24-48 horas a todo el país.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30 flex items-center justify-center transform transition-transform hover:scale-105">
                    <RefreshCw className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">
                      Devolución sin complicaciones
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      30 días para cambios y devoluciones.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 h-12 w-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 shadow-lg shadow-purple-500/30 flex items-center justify-center transform transition-transform hover:scale-105">
                    <Check className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-base font-medium text-gray-900 dark:text-white">Calidad garantizada</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Todos los productos pasan control de calidad.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Banner de mejor precio */}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <div className="p-6 lg:p-10">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 rounded-2xl p-6 shadow-lg border border-blue-100 dark:border-blue-800">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      ¿Encontraste un mejor precio?
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-4">
                      Si encuentras este producto a un mejor precio en cualquier otra tienda, envíanos una captura de
                      pantalla y te igualaremos o mejoraremos la oferta. ¡Garantizamos el mejor precio del mercado!
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() =>
                          window.open(
                            `https://wa.me/5493764903766?text=Hola, encontré el producto "${product.name}" a un mejor precio. Me gustaría saber si pueden igualar o mejorar la oferta.`,
                            "_blank",
                          )
                        }
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        Contactar por WhatsApp
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Descripción extendida con Markdown */}
          {product.markdownDescription && (
            <div className="border-t border-gray-200 dark:border-gray-700">
              <div className="p-6 lg:p-10">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Descripción detallada</h2>
                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <ReactMarkdown>{product.markdownDescription}</ReactMarkdown>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Related products */}
        <div className="mt-24 relative">
          {/* Background decoration */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 rounded-3xl -z-10 transform -skew-y-1"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 to-transparent dark:from-red-900/10 rounded-3xl -z-10"></div>

          {/* Section header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">También te puede interesar</h2>
              <div className="mt-2 h-1 w-24 bg-gradient-to-r from-red-600 to-red-400 rounded-full"></div>
            </div>
          </div>

          {loadingRelated ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 group"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-900/5 to-gray-900/30 dark:from-black/20 dark:to-black/60 group-hover:opacity-75 transition-opacity z-10"></div>
                    <div className="h-full w-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                  </div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-4 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : relatedProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct.id}
                  className="group transform transition-all duration-300 hover:-translate-y-1 h-full flex"
                >
                  <ProductCard
                    product={relatedProduct}
                    className="shadow-lg hover:shadow-xl border border-gray-100 dark:border-gray-700 flex-1 flex flex-col"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-gray-400 dark:text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">No se encontraron productos relacionados</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">Intenta buscar en otras categorías</p>
            </div>
          )}

          {/* Bottom decoration */}
          <div className="mt-16 flex justify-center">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-600 to-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
