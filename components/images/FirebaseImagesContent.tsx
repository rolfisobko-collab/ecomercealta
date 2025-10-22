"use client"

import { useState, useEffect } from "react"
import { storage } from "@/lib/firebase"
import { ref, listAll, getDownloadURL } from "firebase/storage"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Download, Copy, Search, RefreshCw, FolderOpen } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ImageItem {
  name: string
  url: string
  path: string
  folder: string
}

export default function FirebaseImagesContent() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [folders, setFolders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const { toast } = useToast()

  // Función para cargar imágenes desde Firebase Storage
  const loadImages = async () => {
    try {
      setLoading(true)
      setError(null)

      // Referencia al bucket de storage
      const storageRef = ref(storage)

      // Listar todos los items en el bucket
      const result = await listAll(storageRef)

      // Extraer carpetas
      const folderSet = new Set<string>()

      // Procesar los prefijos (carpetas)
      result.prefixes.forEach((folderRef) => {
        folderSet.add(folderRef.name)
      })

      setFolders(Array.from(folderSet))

      // Procesar los items (archivos) con un límite de operaciones concurrentes
      const processItems = async (items: any[]) => {
        const results = []
        // Procesar en lotes de 5 para evitar demasiadas operaciones concurrentes
        for (let i = 0; i < items.length; i += 5) {
          const batch = items.slice(i, i + 5)
          const batchResults = await Promise.all(
            batch.map(async (itemRef) => {
              try {
                const url = await getDownloadURL(itemRef)
                const pathParts = itemRef.fullPath.split("/")
                const folder = pathParts.length > 1 ? pathParts[0] : "root"

                return {
                  name: itemRef.name,
                  url,
                  path: itemRef.fullPath,
                  folder,
                }
              } catch (err) {
                console.error(`Error getting download URL for ${itemRef.name}:`, err)
                return null
              }
            }),
          )
          results.push(...batchResults)
        }
        return results
      }

      // Procesar archivos en la raíz
      const rootImages = await processItems(result.items)

      // Procesar archivos en carpetas (limitando a 3 carpetas a la vez)
      const folderImages = []
      const folderArray = Array.from(folderSet)

      for (let i = 0; i < folderArray.length; i += 3) {
        const folderBatch = folderArray.slice(i, i + 3)
        const folderBatchResults = await Promise.all(
          folderBatch.map(async (folderName) => {
            const folderRef = ref(storage, folderName)
            try {
              const folderResult = await listAll(folderRef)
              return processItems(folderResult.items)
            } catch (err) {
              console.error(`Error listing contents of folder ${folderName}:`, err)
              return []
            }
          }),
        )

        for (const results of folderBatchResults) {
          folderImages.push(...results)
        }
      }

      // Combinar y filtrar resultados
      const allImages = [...rootImages, ...folderImages].filter((img): img is ImageItem => img !== null)
      setImages(allImages)
    } catch (err) {
      console.error("Error loading images from Firebase Storage:", err)
      setError("Error al cargar imágenes del almacenamiento. Por favor, intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  // Cargar imágenes al montar el componente
  useEffect(() => {
    loadImages()
  }, [])

  // Filtrar imágenes según el término de búsqueda y la carpeta seleccionada
  const filteredImages = images.filter((image) => {
    const matchesSearch =
      searchTerm === "" ||
      image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.path.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFolder = currentFolder === null || image.folder === currentFolder

    return matchesSearch && matchesFolder
  })

  // Copiar URL al portapapeles
  const copyToClipboard = (url: string) => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast({
          title: "URL copiada",
          description: "La URL de la imagen ha sido copiada al portapapeles",
        })
      })
      .catch((err) => {
        console.error("Error copying to clipboard:", err)
        toast({
          title: "Error",
          description: "No se pudo copiar la URL al portapapeles",
          variant: "destructive",
        })
      })
  }

  return (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Imágenes de Firebase Storage</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Explora y gestiona las imágenes almacenadas en tu bucket de Firebase Storage
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar imágenes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Button onClick={loadImages} variant="outline" className="flex items-center gap-2" disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all" onClick={() => setCurrentFolder(null)}>
              Todas
            </TabsTrigger>
            {folders.map((folder) => (
              <TabsTrigger key={folder} value={folder} onClick={() => setCurrentFolder(folder)}>
                {folder}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            {renderImageGrid(filteredImages, copyToClipboard, loading, error)}
          </TabsContent>

          {folders.map((folder) => (
            <TabsContent key={folder} value={folder} className="mt-0">
              {renderImageGrid(
                images.filter((img) => img.folder === folder),
                copyToClipboard,
                loading,
                error,
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  )
}

// Función auxiliar para renderizar la cuadrícula de imágenes
function renderImageGrid(
  images: ImageItem[],
  copyToClipboard: (url: string) => void,
  loading: boolean,
  error: string | null,
) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        <p>{error}</p>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold mb-2">No se encontraron imágenes</h3>
        <p className="text-gray-500 max-w-md">
          No hay imágenes que coincidan con tu búsqueda o no hay imágenes en esta carpeta.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((image) => (
        <Card key={image.path} className="overflow-hidden group">
          <CardContent className="p-0 relative">
            <img src={image.url || "/placeholder.svg"} alt={image.name} className="w-full aspect-square object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <div className="flex gap-2">
                <Button size="icon" variant="secondary" onClick={() => copyToClipboard(image.url)} title="Copiar URL">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  onClick={() => window.open(image.url, "_blank")}
                  title="Descargar"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
          <div className="p-2">
            <p className="text-xs truncate" title={image.name}>
              {image.name}
            </p>
            <p className="text-xs text-gray-500 truncate" title={image.path}>
              {image.path}
            </p>
          </div>
        </Card>
      ))}
    </div>
  )
}
