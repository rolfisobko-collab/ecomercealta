"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Upload, ImageIcon, Save, ArrowLeft } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Category } from "@/models/Category"
import { categoryService } from "@/services/hybrid/categoryService"
import Link from "next/link"
import { uploadToCloudinary } from "@/lib/cloudinary"

export default function NewCategoryPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    imageUrl: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

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

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setIsLoading(true)
      setUploadError(null)

      // Validate form
      if (!formData.name.trim()) {
        toast({
          title: "Error",
          description: "El nombre de la categoría es obligatorio",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      let imageUrl = formData.imageUrl

      // Upload image if selected - usando Cloudinary
      if (imageFile) {
        try {
          setUploadProgress(10)

          // Usar la función de Cloudinary para subir la imagen
          const result = await uploadToCloudinary(imageFile)

          setUploadProgress(100)

          if (result && result.secure_url) {
            imageUrl = result.secure_url
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
          setIsLoading(false)
          return
        }
      }

      // Create category object
      const newCategory = new Category({
        name: formData.name,
        description: formData.description,
        imageUrl: imageUrl,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      // Save to Firebase
      await categoryService.create(newCategory)

      toast({
        title: "Categoría creada",
        description: `La categoría "${formData.name}" ha sido creada exitosamente`,
      })

      // Redirect to categories list
      router.push("/admin/categories")
    } catch (error: any) {
      console.error("Error al crear la categoría:", error)
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al crear la categoría. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Nueva Categoría</h1>
        <Link href="/admin/categories">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </Link>
      </div>

      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle>Información de la Categoría</CardTitle>
            <CardDescription>
              Completa los siguientes campos para crear una nueva categoría. La imagen es opcional pero recomendada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Ej: Pantallas, Baterías, etc."
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe brevemente esta categoría..."
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">URL de imagen (opcional)</Label>
              <Input
                id="imageUrl"
                name="imageUrl"
                placeholder="https://ejemplo.com/imagen.jpg"
                value={formData.imageUrl}
                onChange={handleInputChange}
                disabled={!!imageFile}
              />
              <p className="text-sm text-gray-500">O sube una imagen directamente:</p>
            </div>

            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="imageUpload"
                  className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  {imagePreview ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Vista previa"
                        className="max-h-60 max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG o WEBP (Máx. 5MB)</p>
                    </div>
                  )}
                  <input
                    id="imageUpload"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/webp, image/gif"
                    onChange={handleImageChange}
                    disabled={isLoading}
                  />
                </label>
              </div>
              {imageFile && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span className="truncate">{imageFile.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="ml-auto"
                    onClick={() => {
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    disabled={isLoading}
                  >
                    Eliminar
                  </Button>
                </div>
              )}

              {uploadError && <div className="text-sm text-red-500 mt-2">Error: {uploadError}</div>}

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                  <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              type="button"
              onClick={() => router.push("/admin/categories")}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Categoría
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
