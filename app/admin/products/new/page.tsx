"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { serverTimestamp, doc, setDoc, collection, getDocs, updateDoc } from "firebase/firestore"
import { v4 as uuidv4 } from "uuid"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useCategories } from "@/hooks/useCategories"
import { ArrowLeft, Trash, Youtube, PlusCircle, Barcode } from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"
import { productService } from "@/services/hybrid/productService"
import { storage } from "@/lib/firebase"
import { ref, getDownloadURL, uploadBytes } from "firebase/storage"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import ImageSelector from "@/components/images/ImageSelector"
import ReactMarkdown from "react-markdown"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import "github-markdown-css/github-markdown-light.css"

// Funciones para manejar localStorage con IDs únicos
const saveImagesToLocalStorage = (productId: string, image1: string, image2: string, image3: string, image4: string, image5: string) => {
  try {
    // Guardar cada imagen individualmente con ID del producto
    localStorage.setItem(`productImage1_${productId}`, image1 || "")
    localStorage.setItem(`productImage2_${productId}`, image2 || "")
    localStorage.setItem(`productImage3_${productId}`, image3 || "")
    localStorage.setItem(`productImage4_${productId}`, image4 || "")
    localStorage.setItem(`productImage5_${productId}`, image5 || "")

    const images = [image1, image2, image3, image4, image5].filter(
      (img) => img !== "" && img !== undefined && img !== null,
    )
    localStorage.setItem(`productImages_${productId}`, JSON.stringify(images))
  } catch (error) {
    console.error("Error al guardar en localStorage:", error)
  }
}

const getImagesFromLocalStorage = (productId: string) => {
  try {
    const images = []
    for (let i = 1; i <= 5; i++) {
      const url = localStorage.getItem(`productImage${i}_${productId}`)
      if (url) {
        images.push(url)
      }
    }
    return images
  } catch (error) {
    console.error("Error al recuperar de localStorage:", error)
    return []
  }
}

// Componente principal
export default function ProductPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { categories, loading: categoriesLoading } = useCategories()

  // Determinar si estamos en modo edición
  const productIdFromQuery = searchParams.get("id")
  const isEditMode = productIdFromQuery !== null
  const productId = productIdFromQuery || ""

  // Estados
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [promoPrice, setPromoPrice] = useState("")
  const [cost, setCost] = useState("")
  const [quantity, setQuantity] = useState("")
  const [category, setCategory] = useState("")
  const [location, setLocation] = useState("")
  const [obs, setObs] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [images, setImages] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [uploadProgress, setUploadProgress] = useState(0)
  const [image1, setImage1] = useState("")
  const [image2, setImage2] = useState("")
  const [image3, setImage3] = useState("")
  const [image4, setImage4] = useState("")
  const [image5, setImage5] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [barcode, setBarcode] = useState("")
  const [markdownDescription, setMarkdownDescription] = useState("")

  const [brand, setBrand] = useState("")
  const [brands, setBrands] = useState([])
  const [isLoadingBrands, setIsLoadingBrands] = useState(false)
  const [showBrandModal, setShowBrandModal] = useState(false)
  const [newBrandName, setNewBrandName] = useState("")
  const [newBrandImage, setNewBrandImage] = useState("")
  const [isSavingBrand, setIsSavingBrand] = useState(false)

  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState([])

  const fileInputRef = useRef(null)

  const [showImageSelector, setShowImageSelector] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageAlt, setImageAlt] = useState("")

  // Validar URL de YouTube
  const isValidYouTubeUrl = (url) => {
    if (!url) return false
    return url.includes("youtube.com") || url.includes("youtu.be")
  }

  // Cargar datos del producto
  useEffect(() => {
    if (isEditMode && productId) {
      loadProductData(productId)
    }
  }, [isEditMode, productId])

  // Cargar imágenes desde localStorage
  useEffect(() => {
    const img1 = localStorage.getItem("productImage1") || ""
    const img2 = localStorage.getItem("productImage2") || ""
    const img3 = localStorage.getItem("productImage3") || ""
    const img4 = localStorage.getItem("productImage4") || ""
    const img5 = localStorage.getItem("productImage5") || ""

    setImage1(img1)
    setImage2(img2)
    setImage3(img3)
    setImage4(img4)
    setImage5(img5)

    const validUrls = [img1, img2, img3, img4, img5].filter((url) => url !== "")
    if (validUrls.length > 0) {
      setImageUrls(validUrls)
    }
  }, [])

  // Cargar datos del producto
  const loadProductData = async (id) => {
    try {
      setIsLoading(true)
      const product = await productService.getById(id)

      if (product) {
        setName(product.name)
        setDescription(product.description)
        setBarcode(product.barcode || "")
        setMarkdownDescription(product.markdownDescription || "")
        setPrice(product.price.toString())
        setPromoPrice(product.promoPrice ? product.promoPrice.toString() : "")
        setCost(product.cost.toString())
        setQuantity(product.quantity.toString())
        setCategory(product.category)
        setLocation(product.location)
        setObs(product.obs)
        setYoutubeUrl(product.youtubeUrl || "")
        setBrand(product.brand || "")
        setTags(product.tags || [])

        setImage1(product.image1 || "")
        setImage2(product.image2 || "")
        setImage3(product.image3 || "")
        setImage4(product.image4 || "")
        setImage5(product.image5 || "")

        const validUrls = [product.image1, product.image2, product.image3, product.image4, product.image5].filter(
          (url) => url !== undefined && url !== null && url !== "",
        )

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

  // Cargar marcas
  const loadBrands = async () => {
    try {
      setIsLoadingBrands(true)
      // Aquí deberías obtener las marcas de Firebase
      const brandsCollection = collection(db, "brands")
      const brandsSnapshot = await getDocs(brandsCollection)
      const brandsData = brandsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setBrands(brandsData)
    } catch (error) {
      console.error("Error al cargar las marcas:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las marcas",
        variant: "destructive",
      })
    } finally {
      setIsLoadingBrands(false)
    }
  }

  // Actualizar imágenes
  const updateIndividualImages = (urls) => {
    const newImage1 = urls.length > 0 ? urls[0] : ""
    const newImage2 = urls.length > 1 ? urls[1] : ""
    const newImage3 = urls.length > 2 ? urls[2] : ""
    const newImage4 = urls.length > 3 ? urls[3] : ""
    const newImage5 = urls.length > 4 ? urls[4] : ""

    setImage1(newImage1)
    setImage2(newImage2)
    setImage3(newImage3)
    setImage4(newImage4)
    setImage5(newImage5)

    saveImagesToLocalStorage(productId || 'new', newImage1, newImage2, newImage3, newImage4, newImage5)
  }

  // Seleccionar imágenes
  const handleImageSelect = async (e) => {
    if (!e.target.files || e.target.files.length === 0) return

    const newFiles = Array.from(e.target.files)
    const newFirebaseUrls = []
    const newPreviewUrls = []

    setUploadProgress(0)

    // Usar Cloudinary en lugar de Firebase Storage para evitar los errores
    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i]
      try {
        // Verificar el tamaño del archivo (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Error",
            description: `La imagen ${file.name} excede el tamaño máximo de 5MB`,
            variant: "destructive",
          })
          continue
        }

        // Verificar el tipo de archivo
        if (!file.type.startsWith("image/")) {
          toast({
            title: "Error",
            description: `El archivo ${file.name} no es una imagen válida`,
            variant: "destructive",
          })
          continue
        }

        // Crear un objeto URL para la vista previa
        const objectUrl = URL.createObjectURL(file)
        newPreviewUrls.push(objectUrl)

        // Subir a Cloudinary usando nuestra API
        const formData = new FormData()
        formData.append("file", file)

        try {
          const response = await fetch("/api/upload-cloudinary", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`)
          }

          const data = await response.json()
          console.log("Cloudinary upload successful:", data)

          newFirebaseUrls.push(data.url)
          setUploadProgress(((i + 1) / newFiles.length) * 100)
        } catch (uploadError) {
          console.error(`Error al subir imagen ${i + 1} a Cloudinary:`, uploadError)

          // Intentar subir a Firebase como fallback
          try {
            console.log("Intentando subir a Firebase como alternativa...")
            const storagePath = isEditMode && productId ? `stock/${productId}` : `stock/temp-${Date.now()}`
            const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
            const storageRef = ref(storage, `${storagePath}/${fileName}`)

            // Usar método más simple para subir
            const snapshot = await uploadBytes(storageRef, file)
            console.log("Firebase upload successful:", snapshot)

            const downloadURL = await getDownloadURL(snapshot.ref)
            newFirebaseUrls.push(downloadURL)
          } catch (firebaseError) {
            console.error("Error también en Firebase:", firebaseError)
            URL.revokeObjectURL(objectUrl)
            newPreviewUrls.pop() // Eliminar la vista previa si ambos métodos fallan

            toast({
              title: "Error al subir imagen",
              description: `No se pudo subir la imagen ${file.name}. Por favor, intente con otra imagen.`,
              variant: "destructive",
            })
          }
        }
      } catch (error) {
        console.error(`Error general al procesar imagen ${i + 1}:`, error)
        toast({
          title: "Error",
          description: `No se pudo procesar la imagen ${file.name}`,
          variant: "destructive",
        })
      }
    }

    // Actualizar el estado con las imágenes subidas exitosamente
    if (newFirebaseUrls.length > 0) {
      setImages((prev) => [...prev, ...newFiles.slice(0, newFirebaseUrls.length)])
      setImageUrls((prev) => [...prev, ...newPreviewUrls.slice(0, newFirebaseUrls.length)])

      const currentUrls = [image1, image2, image3, image4, image5].filter((url) => url !== "")
      const combinedUrls = [...currentUrls, ...newFirebaseUrls].slice(0, 5)

      updateIndividualImages(combinedUrls)

      toast({
        title: "Imágenes subidas",
        description: `${newFirebaseUrls.length} de ${newFiles.length} imágenes subidas correctamente`,
      })
    } else {
      toast({
        title: "Error",
        description: "No se pudo subir ninguna imagen. Por favor, intente nuevamente con otras imágenes.",
        variant: "destructive",
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Eliminar imagen
  const removeImage = (index) => {
    URL.revokeObjectURL(imageUrls[index])

    const newImageUrls = imageUrls.filter((_, i) => i !== index)
    setImages((prev) => prev.filter((_, i) => i !== index))
    setImageUrls(newImageUrls)

    const currentUrls = [image1, image2, image3, image4, image5].filter((url) => url !== "")
    const updatedUrls = currentUrls.filter((_, i) => i !== index)

    updateIndividualImages(updatedUrls)
  }

  // Validar formulario
  const validateForm = () => {
    const newErrors = {}

    if (!name.trim()) newErrors.name = "El nombre es obligatorio"
    if (!price.trim()) newErrors.price = "El precio es obligatorio"
    if (isNaN(Number(price)) || Number(price) < 0) newErrors.price = "El precio debe ser un número positivo"
    if (cost.trim() && (isNaN(Number(cost)) || Number(cost) < 0))
      newErrors.cost = "El costo debe ser un número positivo"
    if (quantity.trim() && (isNaN(Number(quantity)) || Number(quantity) < 0))
      newErrors.quantity = "La cantidad debe ser un número positivo"
    if (!category) newErrors.category = "La categoría es obligatoria"

    if (youtubeUrl.trim() && !isValidYouTubeUrl(youtubeUrl)) {
      newErrors.youtubeUrl = "La URL de YouTube no es válida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Obtener ID de video de YouTube
  const getYouTubeVideoId = (url) => {
    if (!url) return null

    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)

    return match && match[2].length === 11 ? match[2] : null
  }

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await saveProduct()
  }

  // Guardar producto
  const saveProduct = async () => {
    try {
      setIsSubmitting(true)

      const finalProductId = isEditMode ? productId : uuidv4()

      // Subir imágenes primero si hay archivos nuevos
      const uploadedImageUrls = []

      if (images.length > 0) {
        setUploadProgress(0)

        for (let i = 0; i < images.length && i < 5; i++) {
          const file = images[i]
          try {
            // Subir a Cloudinary
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/upload-cloudinary", {
              method: "POST",
              body: formData,
            })

            if (!response.ok) {
              throw new Error(`Error HTTP: ${response.status}`)
            }

            const data = await response.json()
            uploadedImageUrls.push(data.url)
            setUploadProgress(((i + 1) / Math.min(images.length, 5)) * 100)
          } catch (uploadError) {
            console.error(`Error al subir imagen ${i + 1}:`, uploadError)

            // Intentar Firebase como fallback
            try {
              const storagePath = `stock/${finalProductId}`
              const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
              const storageRef = ref(storage, `${storagePath}/${fileName}`)

              const snapshot = await uploadBytes(storageRef, file)
              const downloadURL = await getDownloadURL(snapshot.ref)
              uploadedImageUrls.push(downloadURL)
            } catch (firebaseError) {
              console.error("Error también en Firebase:", firebaseError)
              toast({
                title: "Error al subir imagen",
                description: `No se pudo subir la imagen ${file.name}`,
                variant: "destructive",
              })
            }
          }
        }
      }

      // Usar las URLs subidas o las existentes (para modo edición)
      const finalImage1 = uploadedImageUrls[0] || image1 || ""
      const finalImage2 = uploadedImageUrls[1] || image2 || ""
      const finalImage3 = uploadedImageUrls[2] || image3 || ""
      const finalImage4 = uploadedImageUrls[3] || image4 || ""
      const finalImage5 = uploadedImageUrls[4] || image5 || ""

      const imagesArray = [finalImage1, finalImage2, finalImage3, finalImage4, finalImage5].filter(
        (img) => img && img.trim() !== "",
      )

      console.log("GUARDANDO PRODUCTO CON IMÁGENES:", imagesArray)
      console.log("GUARDANDO MARKDOWN:", markdownDescription)

      // Create a sanitized data object that is safe for Firestore
      const dataForFirestore = {
        name: name ?? "",
        description: description ?? "",
        markdownDescription: markdownDescription ?? "",
        barcode: barcode || null,
        price: isNaN(Number(price)) ? 0 : Number(price),
        promoPrice: promoPrice && !isNaN(Number(promoPrice)) ? Number(promoPrice) : null,
        cost: isNaN(Number(cost)) ? 0 : Number(cost),
        currency: "USD",
        quantity: isNaN(Number(quantity)) ? 0 : Number(quantity),
        category: category ?? "",
        brand: brand || null,
        tags: tags ?? [],
        location: location ?? "",
        obs: obs ?? "",
        images: imagesArray,
        image1: finalImage1,
        image2: finalImage2,
        image3: finalImage3,
        image4: finalImage4,
        image5: finalImage5,
        youtubeVideoId: youtubeUrl ? getYouTubeVideoId(youtubeUrl) : null,
        youtubeUrl: youtubeUrl ?? "",
        updatedAt: serverTimestamp(),
      }

      // Guardar en MongoDB usando API
      const response = await fetch('/api/products', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: finalProductId,
          ...dataForFirestore,
          createdAt: isEditMode ? undefined : new Date(),
        }),
      })

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`)
      }

      toast({
        title: isEditMode ? "Producto actualizado" : "Producto creado",
        description: `El producto "${name}" ha sido ${isEditMode ? "actualizado" : "creado"} correctamente con ${imagesArray.length} imágenes.`,
      })

      // Limpiar localStorage solo después de guardar exitosamente
      localStorage.removeItem("productImages")
      for (let i = 1; i <= 5; i++) {
        localStorage.removeItem(`productImage${i}`)
      }

      router.push("/admin/products")
    } catch (error) {
      console.error("ERROR AL GUARDAR PRODUCTO:", error)
      setIsSubmitting(false)
      toast({
        title: "Error",
        description: "Ha ocurrido un error al guardar el producto",
        variant: "destructive",
      })
    }
  }

  // Añadir etiqueta
  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput("")
    }
  }

  // Eliminar etiqueta
  const removeTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  // Manejar tecla Enter en input de etiquetas
  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  // Guardar nueva marca
  const saveBrand = async () => {
    if (!newBrandName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la marca es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSavingBrand(true)
      const brandId = uuidv4()

      // Crear documento de marca en Firebase
      const brandData = {
        id: brandId,
        name: newBrandName,
        image: newBrandImage || "",
        createdAt: serverTimestamp(),
      }

      await setDoc(doc(db, "brands", brandId), brandData)

      // Actualizar estado local
      setBrands((prev) => [...prev, brandData])
      setBrand(brandId) // Seleccionar la marca recién creada

      // Cerrar modal y limpiar
      setShowBrandModal(false)
      setNewBrandName("")
      setNewBrandImage("")

      toast({
        title: "Marca creada",
        description: `La marca "${newBrandName}" ha sido creada correctamente`,
      })
    } catch (error) {
      console.error("Error al crear marca:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la marca",
        variant: "destructive",
      })
    } finally {
      setIsSavingBrand(false)
    }
  }

  // Cargar marcas al inicio
  useEffect(() => {
    loadBrands()
  }, [])

  // Título y texto del botón
  const pageTitle = isEditMode ? "Editar Producto" : "Nuevo Producto"
  const buttonText = isEditMode ? "Guardar Cambios" : "Guardar Producto"

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-white dark:bg-gray-950 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" asChild className="mr-1">
            <Link href="/admin/products">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/products">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            form="product-form"
            className="bg-red-600 hover:bg-red-700"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                {isEditMode ? "Actualizando..." : "Guardando..."}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <form id="product-form" onSubmit={handleSubmit} className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información básica */}
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
                      className={errors.description ? "border-red-500" : ""}
                      rows={4}
                    />
                    {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <Label htmlFor="markdownDescription">Descripción Detallada (Markdown)</Label>
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

              {/* Multimedia */}
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
                      onChange={(e) => {
                        if (!e.target.files || e.target.files.length === 0) return

                        const newFiles = Array.from(e.target.files)

                        // Validar archivos antes de procesarlos
                        const validFiles = []
                        for (const file of newFiles) {
                          if (file.size > 5 * 1024 * 1024) {
                            toast({
                              title: "Error",
                              description: `La imagen ${file.name} excede el tamaño máximo de 5MB`,
                              variant: "destructive",
                            })
                            continue
                          }

                          if (!file.type.startsWith("image/")) {
                            toast({
                              title: "Error",
                              description: `El archivo ${file.name} no es una imagen válida`,
                              variant: "destructive",
                            })
                            continue
                          }

                          validFiles.push(file)
                        }

                        if (validFiles.length > 0) {
                          // Guardar archivos para subir después
                          setImages((prev) => [...prev, ...validFiles])

                          // Crear URLs de vista previa
                          const previewUrls = validFiles.map((file) => URL.createObjectURL(file))
                          setImageUrls((prev) => [...prev, ...previewUrls])

                          toast({
                            title: "Imágenes seleccionadas",
                            description: `${validFiles.length} imagen(es) lista(s) para subir cuando guardes el producto`,
                          })
                        }

                        // Limpiar el input
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ""
                        }
                      }}
                      multiple
                      disabled={isSubmitting}
                      className="cursor-pointer"
                    />
                    <p className="text-sm text-gray-500">Las imágenes se subirán cuando guardes el producto</p>
                  </div>

                  {imageUrls.length > 0 && (
                    <div className="space-y-2">
                      <Label>Imágenes Seleccionadas</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url || "/placeholder.svg"}
                              alt={`Preview ${index + 1}`}
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

              {/* Precios */}
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
                      <Label htmlFor="promoPrice">Precio promocional</Label>
                      <Input
                        id="promoPrice"
                        type="number"
                        min="0"
                        step="0.01"
                        value={promoPrice}
                        onChange={(e) => setPromoPrice(e.target.value)}
                        placeholder="Opcional"
                      />
                      <p className="text-xs text-gray-500">Dejar vacío si no hay promoción</p>
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

              {/* Información adicional */}
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

            {/* Columna lateral */}
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
                    <div className="space-y-2">
                      <Label htmlFor="category">
                        Categoría <span className="text-red-500">*</span>
                      </Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category" className={errors.category ? "border-red-500" : ""}>
                          <SelectValue placeholder="Selecciona una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                          {categoriesLoading ? (
                            <SelectItem value="loading" disabled>
                              Cargando categorías...
                            </SelectItem>
                          ) : (
                            categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="brand">Marca</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowBrandModal(true)}
                          className="h-8 text-xs"
                        >
                          <PlusCircle className="h-3.5 w-3.5 mr-1" />
                          Nueva marca
                        </Button>
                      </div>
                      <Select value={brand} onValueChange={setBrand}>
                        <SelectTrigger id="brand">
                          <SelectValue placeholder="Selecciona una marca" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-brand">Sin marca</SelectItem>
                          {isLoadingBrands ? (
                            <SelectItem value="loading" disabled>
                              Cargando marcas...
                            </SelectItem>
                          ) : (
                            brands.map((b) => (
                              <SelectItem key={b.id} value={b.id}>
                                {b.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                      <Label htmlFor="tags">Etiquetas</Label>
                      <div className="flex gap-2">
                        <Input
                          id="tags"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="Añadir etiqueta..."
                          className="flex-1"
                        />
                        <Button type="button" onClick={addTag} disabled={!tagInput.trim()} size="sm">
                          Añadir
                        </Button>
                      </div>
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {tags.map((tag, index) => (
                            <div
                              key={index}
                              className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-md text-sm flex items-center gap-1"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className="text-gray-500 hover:text-red-500"
                              >
                                <Trash className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Presiona Enter o haz clic en Añadir para agregar una etiqueta
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Modal para crear marca */}
      <Dialog open={showBrandModal} onOpenChange={setShowBrandModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear nueva marca</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">
                Nombre de la marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="brandName"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Ej: Samsung, Apple, Xiaomi..."
              />
            </div>

            <div className="space-y-2">
              <Label>Logo de la marca</Label>
              <div className="grid grid-cols-1 gap-4">
                <ImageSelector
                  onSelect={(url) => setNewBrandImage(url)}
                  buttonLabel="Seleccionar logo"
                  currentImage={newBrandImage}
                />

                {newBrandImage && (
                  <div className="relative group mx-auto">
                    <img
                      src={newBrandImage || "/placeholder.svg"}
                      alt="Logo de la marca"
                      className="h-32 object-contain rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => setNewBrandImage("")}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBrandModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={saveBrand}
              disabled={isSavingBrand || !newBrandName.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSavingBrand ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Guardando...
                </>
              ) : (
                "Guardar marca"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Indicador de carga */}
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
