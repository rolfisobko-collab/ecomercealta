"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import type { Category } from "@/models/Category"
import { categoryService } from "@/services/hybrid/categoryService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Upload, ImageIcon, LinkIcon } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { uploadToCloudinary } from "@/lib/cloudinary"

export default function EditCategoryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [category, setCategory] = useState<Category | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState("upload")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Cargar la categoría existente
  useEffect(() => {
    const fetchCategory = async () => {
      setIsLoading(true)
      try {
        const fetchedCategory = await categoryService.getById(params.id)
        if (fetchedCategory) {
          setCategory(fetchedCategory)
          setName(fetchedCategory.name)
          setDescription(fetchedCategory.description || "")
          setImageUrl(fetchedCategory.imageUrl || "")
          if (fetchedCategory.imageUrl) {
            setImagePreview(fetchedCategory.imageUrl)
          }
        } else {
          toast({
            title: "Error",
            description: "No se encontró la categoría",
            variant: "destructive",
          })
          router.push("/admin/categories")
        }
      } catch (error) {
        console.error("Error al cargar la categoría:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la categoría",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (params.id) {
      fetchCategory()
    }
  }, [params.id, router])

  // Manejar cambio de archivo de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamaño del archivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo es demasiado grande. El tamaño máximo permitido es 5MB.",
          variant: "destructive",
        })
        return
      }

      // Validar tipo de archivo
      const validTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG, WEBP y GIF.",
          variant: "destructive",
        })
        return
      }

      setImageFile(file)
      setUploadError(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Manejar cambio de URL de imagen
  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value
    setImageUrl(url)
    if (url) {
      setImagePreview(url)
    } else {
      setImagePreview(null)
    }
  }

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setUploadError(null)

    try {
      // Validar formulario
      if (!name.trim()) {
        toast({
          title: "Error",
          description: "El nombre de la categoría es obligatorio",
          variant: "destructive",
        })
        setIsSaving(false)
        return
      }

      let finalImageUrl = imageUrl

      // Si hay un archivo de imagen nuevo, subirlo a Cloudinary
      if (imageFile) {
        try {
          setUploadProgress(10)

          // Usar la función de Cloudinary para subir la imagen
          const result = await uploadToCloudinary(imageFile)

          setUploadProgress(100)

          if (result && result.secure_url) {
            finalImageUrl = result.secure_url
          } else {
            throw new Error("No se pudo obtener la URL de la imagen subida")
          }
        } catch (error: any) {
          console.error("Error al subir la imagen:", error)
          setUploadError(error.message || "Error al subir la imagen")
          toast({
            title: "Error",
            description: error.message || "No se pudo subir la imagen",
            variant: "destructive",
          })
          setIsSaving(false)
          return
        }
      }

      // Actualizar la categoría
      if (category) {
        await categoryService.update(params.id, {
          name,
          description,
          imageUrl: finalImageUrl,
          updatedAt: new Date().toISOString(),
        })

        toast({
          title: "Éxito",
          description: "Categoría actualizada correctamente",
        })
        router.push("/admin/categories")
      }
    } catch (error: any) {
      console.error("Error al actualizar la categoría:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la categoría",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Cargando categoría...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Editar Categoría</h1>
        <Button variant="outline" onClick={() => router.push("/admin/categories")}>
          Volver a Categorías
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Editar Categoría</CardTitle>
          <CardDescription>Actualiza los detalles de la categoría y su imagen asociada.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre de la categoría"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descripción de la categoría"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <Label>Imagen de la categoría</Label>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Subir imagen
                  </TabsTrigger>
                  <TabsTrigger value="url">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    URL de imagen
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="space-y-4">
                  <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer">
                      <div className="flex flex-col items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-500 mb-2" />
                        <span className="text-sm text-gray-500">Haz clic para seleccionar una imagen</span>
                        <span className="text-xs text-gray-400 mt-1">Máximo 5MB - Formatos: JPG, PNG, WEBP, GIF</span>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  {uploadError && <div className="text-sm text-red-500 mt-2">Error: {uploadError}</div>}

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                      <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">URL de la imagen</Label>
                    <Input
                      id="imageUrl"
                      value={imageUrl}
                      onChange={handleImageUrlChange}
                      placeholder="https://ejemplo.com/imagen.jpg"
                    />
                  </div>
                </TabsContent>
              </Tabs>

              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Vista previa:</p>
                  <div className="relative h-48 w-full overflow-hidden rounded-md border">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Vista previa"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/admin/categories")}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
