"use client"

import type React from "react"

import { useState, useRef } from "react"
import { uploadToCloudinary } from "@/lib/cloudinary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Progress } from "@/components/ui/progress"

export default function TestUploadPage() {
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return

    const selectedFile = e.target.files[0]
    setFile(selectedFile)

    // Create preview URL
    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    // Reset previous upload results
    setUploadedUrl(null)
    setError(null)
    setUploadProgress(0)

    console.log(`Archivo seleccionado: ${selectedFile.name} (${selectedFile.size} bytes)`)
  }

  // Upload to Cloudinary
  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo primero",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setError(null)
    setUploadProgress(10) // Start with 10% to show activity

    try {
      // Simulate progress since Cloudinary doesn't provide progress events
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 500)

      // Upload to Cloudinary
      const imageUrl = await uploadToCloudinary(file)

      // Clear interval and set to 100%
      clearInterval(progressInterval)
      setUploadProgress(100)

      // Set the uploaded URL
      setUploadedUrl(imageUrl)

      toast({
        title: "Éxito",
        description: "Imagen subida correctamente a Cloudinary",
      })
    } catch (err) {
      console.error("Error uploading to Cloudinary:", err)
      const errorMessage = err instanceof Error ? err.message : "Error desconocido"
      setError(errorMessage)

      toast({
        title: "Error",
        description: "Error al subir la imagen: " + errorMessage,
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Prueba de Carga de Imágenes (Cloudinary)</h1>
      <p className="mb-6 text-gray-500">
        Esta página es para probar la carga de imágenes a Cloudinary de forma directa y simple.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar y Subir Imagen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="image">Seleccionar Imagen</Label>
              <Input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
              />
              <p className="text-sm text-gray-500">Selecciona una imagen para subir (JPG, PNG, etc.)</p>
            </div>

            {previewUrl && (
              <div className="space-y-2">
                <Label>Vista Previa</Label>
                <div className="border rounded-md overflow-hidden">
                  <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="max-h-48 mx-auto" />
                </div>
                {file && (
                  <p className="text-sm text-gray-500">
                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <Label>Progreso: {uploadProgress.toFixed(0)}%</Label>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}

            <Button onClick={handleUpload} disabled={!file || uploading} className="w-full bg-red-600 hover:bg-red-700">
              {uploading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Subiendo a Cloudinary...
                </>
              ) : (
                "Subir Imagen"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resultados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-md">
                <h3 className="font-semibold mb-1">Error</h3>
                <p>{error}</p>
              </div>
            )}

            {uploadedUrl && (
              <div className="space-y-2">
                <h3 className="font-semibold">Imagen Subida Correctamente</h3>
                <div className="border rounded-md overflow-hidden">
                  <img src={uploadedUrl || "/placeholder.svg"} alt="Uploaded" className="max-h-48 mx-auto" />
                </div>
                <div className="p-2 bg-gray-50 rounded-md text-xs font-mono break-all">{uploadedUrl}</div>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedUrl)
                    toast({
                      title: "Copiado",
                      description: "URL copiada al portapapeles",
                    })
                  }}
                  variant="outline"
                  size="sm"
                >
                  Copiar URL
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
