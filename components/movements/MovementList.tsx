"use client"

import { useState, useEffect } from "react"
import { type Movement, getMovementTypeColor, movementTypeLabels } from "@/models/Movement"
import { movementService } from "@/services/hybrid/movementService"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Eye, FileText, Search, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { MovementForm } from "./MovementForm"
import { Skeleton } from "@/components/ui/skeleton"

export function MovementList() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [filteredMovements, setFilteredMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const { toast } = useToast()
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  useEffect(() => {
    loadMovements()
  }, [])

  useEffect(() => {
    filterMovements()
  }, [movements, searchTerm, typeFilter])

  const loadMovements = async () => {
    try {
      setLoading(true)
      const data = await movementService.getAll()
      setMovements(data)
    } catch (error) {
      console.error("Error loading movements:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los movimientos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterMovements = () => {
    let filtered = movements

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((movement) => movement.type === typeFilter)
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (movement) =>
          movement.supplierName?.toLowerCase().includes(term) ||
          movement.notes.toLowerCase().includes(term) ||
          movement.items.some((item) => item.productName.toLowerCase().includes(term)),
      )
    }

    setFilteredMovements(filtered)
  }

  const handleDelete = async (id: string) => {
    try {
      await movementService.delete(id)
      setMovements((prev) => prev.filter((movement) => movement.id !== id))
      toast({
        title: "Movimiento eliminado",
        description: "El movimiento se ha eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting movement:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el movimiento",
        variant: "destructive",
      })
    }
  }

  const handleEditSuccess = () => {
    loadMovements()
    setIsEditDialogOpen(false)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Filtra los movimientos por tipo o busca por nombre</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="md:hidden mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Filtros</span>
            <Button size="sm" variant="outline" onClick={() => setShowFiltersMobile(v => !v)}>
              {showFiltersMobile ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showFiltersMobile ? '' : 'hidden'} md:grid`}>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar movimientos..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {Object.entries(movementTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Movimientos</CardTitle>
          <CardDescription>{filteredMovements.length} movimientos encontrados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMovements.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                      Proveedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                      Productos
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {movement.date instanceof Date
                          ? format(movement.date, "dd/MM/yyyy", { locale: es })
                          : "Fecha no disponible"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getMovementTypeColor(movement.type)}>
                          {movementTypeLabels[movement.type]}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                        {movement.supplierName || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {movement.currency === "ARS" ? "🇦🇷 " : ""}${movement.totalAmount.toFixed(2)} {movement.currency}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                        {movement.items.length} productos
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMovement(movement)
                              setIsViewDialogOpen(true)
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMovement(movement)
                              setIsEditDialogOpen(true)
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Esto eliminará permanentemente este movimiento y
                                  actualizará el stock de los productos.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(movement.id)}>
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <p className="text-gray-500">No se encontraron movimientos</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Movement Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Detalles del Movimiento</DialogTitle>
            <DialogDescription>Información detallada del movimiento</DialogDescription>
          </DialogHeader>

          {selectedMovement && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Tipo</h3>
                  <Badge className={getMovementTypeColor(selectedMovement.type)}>
                    {movementTypeLabels[selectedMovement.type]}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Fecha</h3>
                  <p>
                    {selectedMovement.date instanceof Date
                      ? format(selectedMovement.date, "PPP", { locale: es })
                      : "Fecha no disponible"}
                  </p>
                </div>
                {selectedMovement.supplierName && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Proveedor</h3>
                    <p>{selectedMovement.supplierName}</p>
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total</h3>
                  <p className="font-medium">
                    {selectedMovement.currency === "ARS" ? "🇦🇷 " : ""}${selectedMovement.totalAmount.toFixed(2)}{" "}
                    {selectedMovement.currency}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">Productos</h3>
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio Unit.
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedMovement.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.productName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.quantity}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${item.totalPrice.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {selectedMovement.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Notas</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{selectedMovement.notes}</p>
                </div>
              )}

              {selectedMovement.attachments && selectedMovement.attachments.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Adjuntos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {selectedMovement.attachments.map((url, index) => (
                      <a
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block border rounded-md overflow-hidden hover:opacity-80 transition-opacity"
                      >
                        {url.toLowerCase().endsWith(".pdf") ? (
                          <div className="flex items-center justify-center h-24 bg-gray-100">
                            <span className="text-sm">Ver PDF</span>
                          </div>
                        ) : (
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Adjunto ${index + 1}`}
                            className="h-24 w-full object-cover"
                          />
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Movement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Movimiento</DialogTitle>
          </DialogHeader>
          {selectedMovement && <MovementForm initialData={selectedMovement} onSuccess={handleEditSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
