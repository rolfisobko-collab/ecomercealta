"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { serverTimestamp, doc, setDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCategories } from "@/hooks/useCategories"
import { ArrowLeft, Trash, Youtube, X, AlertCircle, Barcode } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { productService } from "@/services/hybrid/productService"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import ReactMarkdown from "react-markdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import "github-markdown-css/github-markdown-light.css"
import ImageSelector from "@/components/images/ImageSelector"

// Funciones para manejar localStorage con IDs únicos
const saveImagesToLocalStorage = (productId: string, image1: string, image2: string, image3: string, image4: string, image5: string) => {
  try {
    // Guardar cada imagen individualmente con ID del producto
    localStorage.setItem(`productImage1_${productId}`, image1)
    localStorage.setItem(`productImage2_${productId}`, image2)
    localStorage.setItem(`productImage3_${productId}`, image3)
    localStorage.setItem(`productImage4_${productId}`, image4)
    localStorage.setItem(`productImage5_${productId}`, image5)

    // También guardar el array completo para compatibilidad
    const images = [image1, image2, image3, image4, image5].filter((img) => img !== "")
    localStorage.setItem(`productImages_${productId}`, JSON.stringify(images))
  } catch (error) {
    console.error("Error al guardar en localStorage:", error)
  }
}

// Componente principal para editar productos
export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { categories, loading: categoriesLoading } = useCategories()

  // Obtener el ID del producto de los parámetros de ruta
  const productId = params?.id as string

  // Estado para controlar la carga del producto
  const [isLoading, setIsLoading] = useState(true)

  // Form state
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [promoPrice, setPromoPrice] = useState("") // Añadir estado para precio promocional
  const [cost, setCost] = useState("")
  const [quantity, setQuantity] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [obs, setObs] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")

  // Añadir después de los otros estados (cerca de la línea 60)
  const [barcode, setBarcode] = useState("")
  const [markdownDescription, setMarkdownDescription] = useState("")
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")

  // Estado para el alert del precio promocional
  const [showPromoAlert, setShowPromoAlert] = useState(false)

  // Image handling
  const [images, setImages] = useState<File[]>([])
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados individuales para cada imagen
  const [image1, setImage1] = useState<string>("")
  const [image2, setImage2] = useState<string>("")
  const [image3, setImage3] = useState<string>("")
  const [image4, setImage4] = useState<string>("")
  const [image5, setImage5] = useState<string>("")

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showNoImagesModal, setShowNoImagesModal] = useState(false)

  // Cargar datos del producto
  useEffect(() => {
    if (productId) {
      loadProductData(productId)
    }
  }, [productId])

  // Función para cargar los datos del producto
  const loadProductData = async (id: string) => {
    try {
      setIsLoading(true)
      const product = await productService.getById(id)

      // Agregar log para ver la respuesta completa
      console.log("RESPUESTA COMPLETA DEL PRODUCTO:", JSON.stringify(product))

      if (product) {
        // Rellenar el formulario con los datos del producto
        setName(product.name)
        // Modificar dentro de la función loadProductData, después de setName(product.name)
        setDescription(product.description)

        // Añadir logs específicos para el markdown
        console.log("Markdown desde API:", product.markdownDescription)
        console.log("Tipo de markdownDescription:", typeof product.markdownDescription)

        // Asegurar que markdownDescription se cargue correctamente
        setBarcode(product.barcode || "")
        setMarkdownDescription(product.markdownDescription || "")
        setPrice(product.price.toString())

        // Mejorar la carga del precio promocional para asegurar que se muestre correctamente
        console.log("Datos completos del producto:", product)
        console.log("Precio promocional del producto (raw):", product.promoPrice)

        // Verificar explícitamente si existe promoPrice y asegurarse de que se cargue correctamente
        if (product.promoPrice !== undefined && product.promoPrice !== null && product.promoPrice !== "") {
          // Convertir a string de manera segura
          const promoPriceString = String(product.promoPrice)
          console.log("Precio promocional convertido a string:", promoPriceString)
          setPromoPrice(promoPriceString)

          // Mostrar el alert si hay precio promocional
          setShowPromoAlert(true)

          // Mostrar un mensaje de confirmación
          toast({
            title: "Precio promocional detectado",
            description: `Este producto tiene un precio promocional de $${promoPriceString}`,
          })
        } else {
          console.log("No se encontró precio promocional para este producto")
          setPromoPrice("")
        }

        setCost(product.cost.toString())
        setQuantity(product.quantity.toString())
        setCategory(product.category)
        setLocation(product.location)
        setObs(product.obs)
        setYoutubeUrl(product.youtubeUrl || "")

        // Cargar imágenes
        setImage1(product.image1 || "")
        setImage2(product.image2 || "")
        setImage3(product.image3 || "")
        setImage4(product.image4 || "")
        setImage5(product.image5 || "")

        // Actualizar URLs de vista previa
        const validUrls = [product.image1, product.image2, product.image3, product.image4, product.image5].filter(
          (url): url is string => url !== undefined && url !== "",
        )

        // Si no hay imágenes individuales pero hay imágenes en el array, usarlas
        if (validUrls.length === 0 && product.images && product.images.length > 0) {
          // Asignar las imágenes del array a las variables individuales
          product.images.forEach((url, index) => {
            if (index === 0) setImage1(url)
            if (index === 1) setImage2(url)
            if (index === 2) setImage3(url)
            if (index === 3) setImage4(url)
            if (index === 4) setImage5(url)
          })

          // Actualizar validUrls con las imágenes del array
          validUrls.push(...product.images.slice(0, 5))

          console.log("Usando imágenes del formato antiguo (array images):", product.images)
        }

        if (validUrls.length > 0) {
          setImageUrls(validUrls)
        }
      } else {
        toast({
          title: "Error",
          description: "No se encontró el producto",
          variant: "destructive",
        })
        router.push("/admin/products")
      }
    } catch (error) {
      console.error("Error al cargar el producto:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el producto",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Función para actualizar las variables individuales y luego guardar en localStorage
  const updateIndividualImages = (urls: string[]) => {
    // Primero asignar a las variables de estado
    const newImage1 = urls.length > 0 ? urls[0] : ""
    const newImage2 = urls.length > 1 ? urls[1] : ""
    const newImage3 = urls.length > 2 ? urls[2] : ""
    const newImage4 = urls.length > 3 ? urls[3] : ""
    const newImage5 = urls.length > 4 ? urls[4] : ""

    // Asignar a las variables de estado
    setImage1(newImage1)
    setImage2(newImage2)
    setImage3(newImage3)
    setImage4(newImage4)
    setImage5(newImage5)

    // Luego guardar en localStorage
    saveImagesToLocalStorage(productId, newImage1, newImage2, newImage3, newImage4, newImage5)
  }

  // Handle image selection
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newFiles = Array.from(e.target.files)
    console.log(`SELECCIONADAS ${newFiles.length} IMÁGENES PARA SUBIR INMEDIATAMENTE`)

    // Crear un array temporal para acumular todas las nuevas URLs
    const newCloudinaryUrls: string[] = []
    const newPreviewUrls: string[] = []

    // Subir cada imagen inmediatamente
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      try {
        console.log(`SUBIENDO IMAGEN ${i + 1}/${newFiles.length} A CLOUDINARY...`)

        // Crear un FormData para la carga
        const formData = new FormData()
        formData.append("file", file)

        // Subir a Cloudinary
        const response = await fetch("/api/upload-cloudinary", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Error al subir imagen: ${response.status}`)
        }

        const data = await response.json()
        console.log(`ÉXITO - IMAGEN ${i + 1} SUBIDA:`, data)

        // Verificar que data.secure_url exista antes de agregarla
        if (data && data.secure_url) {
          // Agregar la URL al array temporal
          newCloudinaryUrls.push(data.secure_url)
          console.log(`GUARDADO - URL COMPLETA: ${data.secure_url}`)

          // Crear URL de vista previa
          const objectUrl = URL.createObjectURL(file)
          newPreviewUrls.push(objectUrl)
        } else {
          console.error("Error: La respuesta de Cloudinary no contiene secure_url", data)
        }
      } catch (error) {
        console.error(`ERROR - AL SUBIR IMAGEN ${i + 1}:`, error)
        toast({
          title: "Error",
          description: `No se pudo subir la imagen ${file.name}`,
          variant: "destructive",
        })
      }
    }

    // Actualizar los estados una sola vez después de procesar todas las imágenes
    if (newCloudinaryUrls.length > 0) {
      // Actualizar las imágenes de vista previa
      setImages((prev) => [...prev, ...newFiles])
      setImageUrls((prev) => [...prev, ...newPreviewUrls])

      // Obtener las URLs actuales
      const currentUrls = [image1, image2, image3, image4, image5].filter((url) => url !== "")

      // Combinar con las nuevas URLs (máximo 5)
      const combinedUrls = [...currentUrls, ...newCloudinaryUrls].slice(0, 5)

      // Actualizar las variables individuales y localStorage
      updateIndividualImages(combinedUrls)
    }

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Remove an image
  const removeImage = (index: number) => {
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(imageUrls[index])

    // Actualizar las imágenes de vista previa
    const newImageUrls = imageUrls.filter((_, i) => i !== index)
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImageUrls(newImageUrls)

    // Obtener las URLs actuales
    const currentUrls = [image1, image2, image3, image4, image5].filter((url) => url !== "")

    // Eliminar la URL en el índice especificado
    const updatedUrls = currentUrls.filter((_, i) => i !== index)

    // Actualizar las variables individuales y localStorage
    updateIndividualImages(updatedUrls)
  }

  // Validate the form
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "El nombre es obligatorio"
    if (!price.trim()) newErrors.price = "El precio es obligatorio"
    if (isNaN(Number(price)) || Number(price) < 0) newErrors.price = "El precio debe ser un número positivo"
    if (cost.trim() && (isNaN(Number(cost)) || Number(cost) < 0))
      newErrors.cost = "El costo debe ser un número positivo"
    if (quantity.trim() && (isNaN(Number(quantity)) || Number(quantity) < 0))
      newErrors.quantity = "La cantidad debe ser un número positivo"
    if (!category) newErrors.category = "La categoría es obligatoria"

    // Validate YouTube URL if provided
    if (youtubeUrl.trim() && !isValidYouTubeUrl(youtubeUrl)) {
      newErrors.youtubeUrl = "La URL de YouTube no es válida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Check if a URL is a valid YouTube URL
  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/
    return youtubeRegex.test(url)
  }

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11 ? match[2] : null
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("INICIANDO PROCESO DE GUARDADO DEL PRODUCTO...")

    if (!validateForm()) {
      console.log("Formulario inválido, se encontraron errores")
      return
    }

    // Verificar si hay al menos una imagen y mostrar advertencia
    const imagesArray = [image1, image2, image3, image4, image5].filter((img) => img !== "")
    if (imagesArray.length === 0) {
      setShowNoImagesModal(true)
      return
    }

    await saveProduct()
  }

  // Guardar el producto - VERSIÓN SIMPLIFICADA QUE FUNCIONA SÍ O SÍ
  const saveProduct = async () => {
    try {
      setIsSubmitting(true)

      // PASO 1: Crear un objeto con todos los datos del producto
      const productData = {
        name,
        description,
        markdownDescription,
        price: Number(price),
        promoPrice: promoPrice ? Number(promoPrice) : null,
        cost: cost ? Number(cost) : 0,
        currency: "USD",
        quantity: quantity ? Number(quantity) : 0,
        category,
        location: location || "",
        obs: obs || "",
        images: [image1, image2, image3, image4, image5].filter((img) => img !== ""),
        image1: image1 || "",
        image2: image2 || "",
        image3: image3 || "",
        image4: image4 || "",
        image5: image5 || "",
        youtubeVideoId: youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null,
        youtubeUrl: youtubeUrl || "",
        barcode: barcode || null,
        updatedAt: new Date(),
      }

      // Guardar en MongoDB usando API
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: productId,
          ...productData,
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      toast({
        title: "¡GUARDADO EXITOSO!",
        description: `El producto "${name}" ha sido actualizado con su descripción markdown.`,
      })

      // Redirigir a la lista de productos
      router.push("/admin/products")
    } catch (error) {
      console.error("ERROR AL GUARDAR:", error)
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: "Error al guardar: " + (error instanceof Error ? error.message : "Error desconocido"),
        variant: "destructive",
      })
    }
  }

  // Verificar si el markdown se cargó correctamente

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barra superior fija estilo Shopify */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white dark:bg-gray-950 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="mr-1">
            <Link href="/admin/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">Editar Producto</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/products">Cancelar</Link>
          </Button>
          <Button
            type="button"
            onClick={async () => {
              try {
                setIsSubmitting(true)

                // GUARDAR DIRECTO A FIREBASE - MÉTODO DE EMERGENCIA
                const docRef = doc(db, "stock", productId)

                // PASO 1: Guardar SOLO el markdown primero
                console.log("GUARDANDO MARKDOWN DIRECTO:", markdownDescription)
                await setDoc(docRef, { markdownDescription }, { merge: true })

                // PASO 2: Ahora guardar todo lo demás
                await saveProduct()
              } catch (error) {
                console.error("ERROR CRÍTICO:", error)
                setIsSubmitting(false)
                alert("ERROR AL GUARDAR MARKDOWN: " + error)
              }
            }}
            className="bg-red-600 hover:bg-red-700 font-bold text-white px-6"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              "Guardar ahora"
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 lg:p-8">
        {/* Alert para precio promocional */}
        {showPromoAlert && promoPrice && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <AlertCircle className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <AlertTitle className="text-green-800 font-medium">
                ¡Atención! Este producto tiene precio promocional
              </AlertTitle>
              <AlertDescription className="text-green-700">
                El producto <strong>{name}</strong> tiene un precio promocional de{" "}
                <strong className="text-lg">${promoPrice}</strong>. El precio regular es ${price}.
              </AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowPromoAlert(false)}
              className="text-green-700 hover:bg-green-100 hover:text-green-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        )}

        <form id="product-form" onSubmit={handleSubmit} className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal - 2/3 del ancho */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información del producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nombre <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className={errors.name ? "border-red-500" : ""}
                    />
                    {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                  </div>

                  {/* Añadir después del campo de nombre, antes del campo de descripción */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="barcode">Código de Barras</Label>
                      <Barcode className="h-4 w-4 text-gray-500" />
                    </div>
                    <Input
                      id="barcode"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Escanea o ingresa el código de barras"
                    />
                    <p className="text-xs text-gray-500">
                      Opcional: Ingresa el código de barras del producto para facilitar la gestión de inventario
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Descripción</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {/* Añadir después del campo de descripción */}
                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="markdownDescription" className="flex items-center">
                        <span>Descripción Detallada (Markdown)</span>
                        {markdownDescription ? (
                          <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded">
                            Activa
                          </span>
                        ) : (
                          <span className="ml-2 bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded">
                            Opcional
                          </span>
                        )}
                      </Label>
                    </div>

                    <Tabs defaultValue="edit" className="w-full">
                      <TabsList className="mb-2">
                        <TabsTrigger value="edit">Editar</TabsTrigger>
                        <TabsTrigger value="preview">Vista previa</TabsTrigger>
                      </TabsList>
                      <TabsContent value="edit">
                        <div className="border rounded-md mb-2">
                          <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMarkdownDescription((md) => `${md}**texto en negrita**`)}
                              title="Negrita"
                            >
                              <span className="font-bold">B</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMarkdownDescription((md) => `${md}*texto en cursiva*`)}
                              title="Cursiva"
                            >
                              <span className="italic">I</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMarkdownDescription((md) => `${md}# Título`)}
                              title="Título"
                            >
                              <span className="font-bold">H1</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMarkdownDescription((md) => `${md}## Subtítulo`)}
                              title="Subtítulo"
                            >
                              <span className="font-bold">H2</span>
                            </Button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMarkdownDescription((md) => `${md}\n- Elemento de lista\n- Otro elemento\n`)
                              }
                              title="Lista con viñetas"
                            >
                              • Lista
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMarkdownDescription((md) => `${md}\n1. Primer elemento\n2. Segundo elemento\n`)
                              }
                              title="Lista numerada"
                            >
                              1. Lista
                            </Button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMarkdownDescription((md) => `${md}\n> Cita o texto destacado\n`)}
                              title="Cita"
                            >
                              " Cita
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMarkdownDescription((md) => `${md}\n\`\`\`\nCódigo aquí\n\`\`\`\n`)}
                              title="Bloque de código"
                            >
                              {"<>"} Código
                            </Button>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMarkdownDescription((md) => `${md}[texto del enlace](https://ejemplo.com)`)
                              }
                              title="Enlace"
                            >
                              🔗 Enlace
                            </Button>
                            <div className="relative">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowImageSelector((prev) => !prev)}
                                title="Insertar imagen"
                              >
                                🖼️ Imagen
                              </Button>
                              {showImageSelector && (
                                <div className="absolute top-full left-0 z-50 mt-1 bg-white dark:bg-gray-900 border rounded-md shadow-lg p-3 w-72">
                                  <div className="mb-2 flex justify-between items-center">
                                    <span className="font-medium">Insertar imagen</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setShowImageSelector(false)}
                                      className="h-6 w-6 p-0"
                                    >
                                      ✕
                                    </Button>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <Label htmlFor="imageUrl" className="text-xs">
                                        URL de la imagen
                                      </Label>
                                      <Input
                                        id="imageUrl"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="https://ejemplo.com/imagen.jpg"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="imageAlt" className="text-xs">
                                        Texto alternativo
                                      </Label>
                                      <Input
                                        id="imageAlt"
                                        value={imageAlt}
                                        onChange={(e) => setImageAlt(e.target.value)}
                                        placeholder="Descripción de la imagen"
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="flex justify-between pt-1">
                                      <span className="text-xs text-gray-500">o selecciona desde la galería</span>
                                      <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => {
                                          if (imageUrl) {
                                            setMarkdownDescription(
                                              (md) => `${md}![${imageAlt || "imagen"}](${imageUrl})`,
                                            )
                                            setShowImageSelector(false)
                                            setImageUrl("")
                                            setImageAlt("")
                                          }
                                        }}
                                        disabled={!imageUrl}
                                        className="h-7"
                                      >
                                        Insertar
                                      </Button>
                                    </div>
                                    <div className="pt-2">
                                      <ImageSelector
                                        onSelect={(url) => {
                                          setImageUrl(url)
                                        }}
                                        buttonLabel="Seleccionar imagen"
                                        currentImage={imageUrl}
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setMarkdownDescription(
                                  (md) =>
                                    `${md}\n| Producto | Precio | Stock |\n| -------- | ------ | ----- |\n| Ejemplo 1 | $100 | 5 |\n| Ejemplo 2 | $200 | 10 |\n`,
                                )
                              }
                              title="Insertar tabla"
                            >
                              🗓️ Tabla
                            </Button>
                          </div>
                          <Textarea
                            id="markdownDescription"
                            value={markdownDescription}
                            onChange={(e) => setMarkdownDescription(e.target.value)}
                            placeholder="Escribe una descripción detallada usando Markdown o usa los botones de arriba para dar formato."
                            rows={10}
                            className="border-0 rounded-t-none focus-visible:ring-0 resize-y"
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="preview">
                        <div className="border rounded-md p-4 min-h-[300px] prose dark:prose-invert max-w-none">
                          {markdownDescription ? (
                            <ReactMarkdown className="break-words">{markdownDescription}</ReactMarkdown>
                          ) : (
                            <p className="text-gray-400 italic">La vista previa aparecerá aquí...</p>
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                    <p className="text-xs text-gray-500">
                      Esta descripción detallada se mostrará en la página del producto y puede incluir formatos, listas,
                      tablas e imágenes.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Media */}
              <Card>
                <CardHeader>
                  <CardTitle>Multimedia</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="images">Imágenes del producto</Label>
                    <Input
                      ref={fileInputRef}
                      id="images"
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      multiple
                      disabled={isSubmitting}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-500">
                      Las imágenes se subirán inmediatamente.{" "}
                      {(image1 || image2 || image3 || image4 || image5) && (
                        <span className="font-bold text-green-600">
                          {[image1, image2, image3, image4, image5].filter((img) => img !== "").length} imágenes subidas
                        </span>
                      )}
                    </p>

                    {/* Mostrar las URLs de las imágenes para depuración */}
                    <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs">
                      <p className="font-medium">Estado de imágenes:</p>
                      <ul className="mt-1 space-y-1 text-gray-500">
                        {image1 ? <li>Imagen 1: ✅</li> : <li>Imagen 1: ❌</li>}
                        {image2 ? <li>Imagen 2: ✅</li> : <li>Imagen 2: ❌</li>}
                        {image3 ? <li>Imagen 3: ✅</li> : <li>Imagen 3: ❌</li>}
                        {image4 ? <li>Imagen 4: ✅</li> : <li>Imagen 4: ❌</li>}
                        {image5 ? <li>Imagen 5: ✅</li> : <li>Imagen 5: ❌</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label>Imágenes del Producto</Label>
                    {[image1, image2, image3, image4, image5].filter((img) => img).length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {image1 && (
                          <div className="relative group">
                            <img
                              src={image1 || "/placeholder.svg"}
                              alt="Imagen 1"
                              className="w-full h-32 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(0)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {image2 && (
                          <div className="relative group">
                            <img
                              src={image2 || "/placeholder.svg"}
                              alt="Imagen 2"
                              className="w-full h-32 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(1)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {image3 && (
                          <div className="relative group">
                            <img
                              src={image3 || "/placeholder.svg"}
                              alt="Imagen 3"
                              className="w-full h-32 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(2)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {image4 && (
                          <div className="relative group">
                            <img
                              src={image4 || "/placeholder.svg"}
                              alt="Imagen 4"
                              className="w-full h-32 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(3)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                        {image5 && (
                          <div className="relative group">
                            <img
                              src={image5 || "/placeholder.svg"}
                              alt="Imagen 5"
                              className="w-full h-32 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(4)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-8 border-2 border-dashed rounded-md text-center">
                        <p className="text-gray-500">No hay imágenes para este producto</p>
                        <p className="text-sm text-gray-400 mt-1">Sube imágenes usando el selector de arriba</p>
                      </div>
                    )}
                  </div>

                  {/* Mostrar imágenes del formato antiguo si no hay imágenes individuales */}
                  {!image1 && !image2 && !image3 && !image4 && !image5 && imageUrls.length > 0 && (
                    <div className="space-y-2 mt-4 border-t pt-4">
                      <Label>Imágenes (Formato Antiguo)</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url || "/placeholder.svg"}
                              alt={`Imagen ${index + 1}`}
                              className="w-full h-32 object-cover rounded-md border"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-amber-600 mt-2">
                        ⚠️ Estas imágenes están en el formato antiguo. Se convertirán al nuevo formato al guardar.
                      </p>
                    </div>
                  )}

                  {isSubmitting && images.length > 0 && (
                    <div className="space-y-2">
                      <Label>Progreso de carga: {uploadProgress.toFixed(0)}%</Label>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="youtubeUrl">Video de YouTube</Label>
                      <Youtube className="h-4 w-4 text-red-600" />
                    </div>
                    <Input
                      id="youtubeUrl"
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className={errors.youtubeUrl ? "border-red-500" : ""}
                    />
                    {errors.youtubeUrl && <p className="text-red-500 text-sm">{errors.youtubeUrl}</p>}
                    <p className="text-sm text-gray-500">
                      Opcional: Agrega un video de YouTube para mostrar en la página del producto.
                    </p>
                  </div>

                  {youtubeUrl && isValidYouTubeUrl(youtubeUrl) && getYouTubeVideoId(youtubeUrl) && (
                    <div className="space-y-2">
                      <Label>Vista previa del video</Label>
                      <div className="aspect-video rounded-md overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${getYouTubeVideoId(youtubeUrl)}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Pricing */}
              <Card>
                <CardHeader>
                  <CardTitle>Precios</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">
                        Precio <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className={errors.price ? "border-red-500" : ""}
                      />
                      {errors.price && <p className="text-red-500 text-sm">{errors.price}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="promoPrice">
                        Precio promocional{" "}
                        {promoPrice && <span className="text-green-500 ml-2">(Activo: ${promoPrice})</span>}
                      </Label>
                      <Input
                        id="promoPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={promoPrice}
                        onChange={(e) => setPromoPrice(e.target.value)}
                        placeholder="Sin promoción"
                        className={promoPrice ? "border-green-500 font-medium bg-green-50" : ""}
                        style={{ color: promoPrice ? "#047857" : "inherit" }}
                      />
                      {promoPrice ? (
                        <div className="mt-1 p-2 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-green-700 font-medium flex items-center">
                            <span className="mr-1">✓</span> Precio promocional activo: ${promoPrice}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500">Dejar vacío si no hay promoción</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="cost">Costo</Label>
                      <Input
                        id="cost"
                        type="number"
                        min="0"
                        step="0.01"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className={errors.cost ? "border-red-500" : ""}
                      />
                      {errors.cost && <p className="text-red-500 text-sm">{errors.cost}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Additional Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Información Adicional</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="obs">Observaciones</Label>
                    <Textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)} rows={3} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Columna lateral - 1/3 del ancho */}
            <div className="space-y-6">
              {/* Estado del producto */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado del producto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Inventario</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={errors.quantity ? "border-red-500" : ""}
                      />
                      {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Organización */}
              <Card>
                <CardHeader>
                  <CardTitle>Organización</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {console.log("Categoría del producto:", category)}
                    {console.log(
                      "Categorías disponibles:",
                      categories.map((c) => ({ id: c.id, name: c.name })),
                    )}

                    {/* Reemplazar el componente Select actual con esta versión mejorada */}
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Categoría <span className="text-red-500">*</span>
                      </Label>
                      {/* Añadir un log para depuración */}
                      {console.log("Valor actual de categoría:", category)}

                      {/* Usar un componente Select controlado de forma más explícita */}
                      {!categoriesLoading && categories.length > 0 ? (
                        <Select value={category} onValueChange={setCategory} defaultValue={category}>
                          <SelectTrigger id="category" className={errors.category ? "border-red-500" : ""}>
                            <SelectValue>
                              {category
                                ? categories.find((cat) => cat.id === category)?.name || "Categoría seleccionada"
                                : "Selecciona una categoría"}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <>
                          <div className="flex items-center space-x-2 h-10 px-3 border rounded-md">
                            <div className="animate-spin h-4 w-4 border-2 border-red-600 rounded-full border-t-transparent"></div>
                            <span className="text-gray-500">Cargando categorías...</span>
                          </div>
                        </>
                      )}

                      {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}

                      {/* Mostrar un selector alternativo si hay problemas */}
                      {category && !categories.some((cat) => cat.id === category) && (
                        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md">
                          <p className="text-amber-600 text-sm font-medium">
                            La categoría seleccionada no se encuentra en la lista
                          </p>
                          <select
                            className="mt-2 w-full p-2 border rounded-md"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                          >
                            <option value="">Selecciona una categoría</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Modal de confirmación para productos sin imágenes */}
      {showNoImagesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">⚠️ Advertencia</h3>
            <p className="mb-6">
              Estás intentando registrar un producto sin imágenes. Un producto sin imágenes no se vende bien. ¿Estás
              seguro que deseas continuar?
            </p>
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={() => setShowNoImagesModal(false)}>
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setShowNoImagesModal(false)
                  saveProduct()
                }}
              >
                Registrar sin imágenes
              </Button>
            </div>
          </div>
        </div>
      )}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600 mb-4"></div>
            <p className="text-lg">Cargando datos del producto...</p>
          </div>
        </div>
      )}
    </div>
  )
}
