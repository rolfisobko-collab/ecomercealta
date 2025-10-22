"use client"

import { useState } from "react"
import { useFirebaseStorage } from "@/hooks/useFirebaseStorage"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Image, FolderOpen } from "lucide-react"

interface ImageSelectorProps {
  onSelect: (imageUrl: string) => void
  buttonLabel?: string
  currentImage?: string
}

export default function ImageSelector({
  onSelect,
  buttonLabel = "Seleccionar imagen",
  currentImage,
}: ImageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const { images, folders, loading, error } = useFirebaseStorage()

  // Filtrar imágenes según el término de búsqueda y la carpeta seleccionada
  const filteredImages = images.filter((image) => {
    const matchesSearch =
      searchTerm === "" ||
      image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.path.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFolder = currentFolder === null || image.folder === currentFolder

    return matchesSearch && matchesFolder
  })

  const handleSelect = (imageUrl: string) => {
    onSelect(imageUrl)
    setIsOpen(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Image className="mr-2 h-4 w-4" />
          {buttonLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Seleccionar imagen</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar imágenes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
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
              {renderImageGrid(filteredImages, handleSelect, loading, error, currentImage)}
            </TabsContent>

            {folders.map((folder) => (
              <TabsContent key={folder} value={folder} className="mt-0">
                {renderImageGrid(
                  images.filter((img) => img.folder === folder),
                  handleSelect,
                  loading,
                  error,
                  currentImage,
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Función auxiliar para renderizar la cuadrícula de imágenes
function renderImageGrid(
  images: Array<{ name: string; url: string; path: string; folder: string }>,
  onSelect: (url: string) => void,
  loading: boolean,
  error: Error | null,
  currentImage?: string,
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
        <p>{error.message}</p>
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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((image) => (
        <div
          key={image.path}
          className={`border rounded-lg overflow-hidden cursor-pointer transition-all hover:shadow-md ${
            currentImage === image.url ? "ring-2 ring-red-600 ring-offset-2" : ""
          }`}
          onClick={() => onSelect(image.url)}
        >
          <div className="aspect-square relative">
            <img src={image.url || "/placeholder.svg"} alt={image.name} className="w-full h-full object-cover" />
          </div>
          <div className="p-2">
            <p className="text-xs truncate" title={image.name}>
              {image.name}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
