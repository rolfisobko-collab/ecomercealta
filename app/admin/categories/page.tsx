"use client"

import { useState } from "react"
import Link from "next/link"
import { useCategories } from "@/hooks/useCategories"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Tags,
  Search,
  Plus,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  X,
  ImageIcon,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCategoryIcon, getIconByKey } from "@/utils/categoryIcons"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { categoryService } from "@/services/hybrid/categoryService"
import { toast } from "@/components/ui/use-toast"

export default function AdminCategories() {
  const { categories, loading } = useCategories()
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const itemsPerPage = 10

  // Filtrar categorías por término de búsqueda
  const filteredCategories = categories.filter(
    (category) =>
      category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Ordenar categorías
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (!sortField) return 0

    let valueA, valueB

    switch (sortField) {
      case "name":
        valueA = a.name.toLowerCase()
        valueB = b.name.toLowerCase()
        break
      case "description":
        valueA = a.description.toLowerCase()
        valueB = b.description.toLowerCase()
        break
      default:
        return 0
    }

    if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
    if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
    return 0
  })

  // Paginación
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCategories = sortedCategories.slice(startIndex, startIndex + itemsPerPage)

  // Función para cambiar el ordenamiento
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  // Función para abrir el modal con la imagen de la categoría
  const openImageModal = (imageUrl: string | undefined, categoryName: string) => {
    if (imageUrl) {
      setSelectedImage(imageUrl)
      setSelectedCategoryName(categoryName)
      setIsImageModalOpen(true)
    }
  }

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return

    try {
      setIsDeleting(true)
      await categoryService.delete(categoryToDelete.id)

      // Actualizar la lista de categorías (filtrar la categoría eliminada)
      const updatedCategories = categories.filter((cat) => cat.id !== categoryToDelete.id)
      // Actualizar el estado local
      // Nota: Esto es un hack ya que no tenemos acceso directo al estado categories
      // En una implementación real, deberíamos usar un contexto o recargar los datos
      Object.defineProperty(categories, "length", { value: 0 })
      categories.push(...updatedCategories)

      toast({
        title: "Categoría eliminada",
        description: `La categoría "${categoryToDelete.name}" ha sido eliminada correctamente.`,
        variant: "default",
      })
    } catch (error) {
      console.error("Error al eliminar la categoría:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setIsDeleteDialogOpen(false)
      setCategoryToDelete(null)
    }
  }

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4 sm:mb-0">Gestión de Categorías</h1>
        <Button asChild className="bg-red-600 hover:bg-red-700">
          <Link href="/admin/categories/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Categoría
          </Link>
        </Button>
      </div>

      <Card className="mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium flex items-center">
            <Filter className="mr-2 h-5 w-5 text-red-600 dark:text-red-400" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar categorías..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1) // Resetear a la primera página al buscar
                }}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("name")}
                          className="flex items-center hover:text-red-600 dark:hover:text-red-400"
                        >
                          Nombre
                          {sortField === "name" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort("description")}
                          className="flex items-center hover:text-red-600 dark:hover:text-red-400"
                        >
                          Descripción
                          {sortField === "description" && <ArrowUpDown className="ml-1 h-4 w-4" />}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCategories.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          <Tags className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-gray-500">No se encontraron categorías</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCategories.map((category) => {
                        const iconVal = (category as any).icon as string | undefined
                        const isUrl = !!iconVal && (iconVal.startsWith('http') || iconVal.startsWith('data:'))
                        const IconComponent = !isUrl && iconVal ? getIconByKey(iconVal) : getCategoryIcon(category.name)
                        return (
                          <TableRow key={category.id}>
                            <TableCell className="font-mono text-xs">{category.id.substring(0, 8)}...</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="mr-2 p-1 bg-red-50 dark:bg-red-900/20 rounded-md">
                                  {isUrl ? (
                                    <img src={iconVal!} alt={category.name} className="h-4 w-4 object-contain" />
                                  ) : (
                                    <IconComponent className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  )}
                                </div>
                                <span className="font-medium">{category.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-md truncate">{category.description}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end space-x-1">
                                {/* Botón para ver la imagen */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openImageModal(category.imageUrl, category.name)}
                                  className="bg-blue-50 hover:bg-blue-100 text-blue-600 border-blue-200 flex items-center transition-all duration-200 hover:scale-105"
                                  title="Ver imagen de la categoría"
                                  disabled={!category.imageUrl}
                                >
                                  <ImageIcon className="h-4 w-4 mr-1" />
                                  <span>Ver imagen</span>
                                </Button>

                                {/* Botón para editar */}
                                <Button
                                  variant="outline"
                                  size="icon"
                                  asChild
                                  className="bg-green-50 hover:bg-green-100 text-green-600 border-green-200"
                                  title="Editar categoría"
                                >
                                  <Link href={`/admin/categories/edit/${category.id}`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>

                                {/* Botón para eliminar */}
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="bg-red-50 hover:bg-red-100 text-red-600 border-red-200"
                                  title="Eliminar categoría"
                                  onClick={() => {
                                    setCategoryToDelete({ id: category.id, name: category.name })
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredCategories.length)} de{" "}
                    {filteredCategories.length} categorías
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="text-sm">
                      Página {currentPage} de {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modal para mostrar la imagen */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl transform transition-all duration-300 ease-in-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-700 dark:to-gray-800">
              <h3 className="text-lg font-medium flex items-center">
                <ImageIcon className="h-5 w-5 mr-2 text-red-500" />
                <span>{selectedCategoryName}</span>
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsImageModalOpen(false)}
                className="rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-auto p-0 flex items-center justify-center bg-gray-100 dark:bg-gray-900 relative">
              {selectedImage ? (
                <div className="relative w-full h-full min-h-[50vh] flex items-center justify-center overflow-hidden">
                  <img
                    src={selectedImage || "/placeholder.svg"}
                    alt={`Imagen de ${selectedCategoryName}`}
                    className="max-w-full max-h-[70vh] object-contain transition-all duration-300 hover:scale-105"
                    style={{ objectFit: "contain" }}
                  />
                  <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-sm rounded-full p-2 text-white text-xs">
                    {selectedCategoryName}
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 flex flex-col items-center p-12">
                  <div className="bg-gray-200 dark:bg-gray-700 rounded-full p-6 mb-4">
                    <ImageIcon className="h-16 w-16 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">No hay imagen disponible</p>
                  <p className="text-sm text-gray-400 mt-2">Esta categoría no tiene una imagen asociada</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-between items-center bg-gradient-to-r from-red-50 to-orange-50 dark:from-gray-700 dark:to-gray-800">
              <p className="text-sm text-gray-500">{selectedImage ? "Haz clic en la imagen para ampliar" : ""}</p>
              <Button
                variant="default"
                onClick={() => setIsImageModalOpen(false)}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
      {isDeleteDialogOpen && categoryToDelete && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente la categoría "{categoryToDelete.name}" y no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault()
                  handleDeleteCategory()
                }}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Eliminando...
                  </>
                ) : (
                  "Eliminar"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
