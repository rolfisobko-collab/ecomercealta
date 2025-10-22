"use client"

import type React from "react"

import { useState, useRef } from "react"
import { storage } from "@/lib/firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useProducts } from "@/hooks/useProducts"
import { Upload, Check, X } from "lucide-react"

export default function UploadProductImages() {
  const [selectedProduct, setSelectedProduct] = useState<string>("")
  const [uploading, setUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { products, loading } = useProducts()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0 || !selectedProduct) return

    const file = files[0]
    const selectedProductObj = products.find((p) => p.id === selectedProduct)

    if (!selectedProductObj) {
      toast({
        title: "Error",
        description: "Producto no encontrado",
        variant: "destructive",
      })
      return
    }

    try {
      setUploading(true)
      setUploadSuccess(false)
      setUploadError(null)

      // Crear una referencia al archivo en Firebase Storage usando la nueva estructura
      const storageRef = ref(storage, `stock/${selectedProduct}/images/${file.name}`)

      // Subir el archivo
      await uploadBytes(storageRef, file)

      // Obtener la URL del archivo subido
      const downloadURL = await getDownloadURL(storageRef)

      setUploadSuccess(true)
      toast({
        title: "Imagen subida correctamente",
        description: `La imagen para ${selectedProductObj.name} ha sido subida.`,
      })

      // Limpiar el input de archivo
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error al subir la imagen:", error)
      setUploadError("Error al subir la imagen. Por favor, inténtalo de nuevo.")
      toast({
        title: "Error al subir la imagen",
        description: "Ha ocurrido un error al subir la imagen. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir imágenes de productos</CardTitle>
        <CardDescription>
          Selecciona un producto y sube una imagen para él. La imagen se guardará en Firebase Storage.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="product">Producto</Label>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger id="product">
              <SelectValue placeholder="Selecciona un producto" />
            </SelectTrigger>
            <SelectContent>
              {loading ? (
                <SelectItem value="loading" disabled>
                  Cargando productos...
                </SelectItem>
              ) : (
                products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Imagen</Label>
          <Input
            ref={fileInputRef}
            id="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading || !selectedProduct}
          />
          <p className="text-sm text-gray-500">Formatos recomendados: JPG, PNG. Tamaño máximo: 5MB.</p>
        </div>

        {uploadSuccess && (
          <div className="flex items-center p-2 bg-green-50 text-green-700 rounded-md">
            <Check className="h-5 w-5 mr-2" />
            <span>Imagen subida correctamente</span>
          </div>
        )}

        {uploadError && (
          <div className="flex items-center p-2 bg-red-50 text-red-700 rounded-md">
            <X className="h-5 w-5 mr-2" />
            <span>{uploadError}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || !selectedProduct}
          className="bg-red-600 hover:bg-red-700"
        >
          {uploading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              Subiendo...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Subir imagen
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
