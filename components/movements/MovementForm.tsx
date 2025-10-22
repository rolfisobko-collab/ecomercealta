"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, Trash2, Upload } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { type Movement, type MovementFormData, type MovementItem, movementTypeLabels } from "@/models/Movement"
import { movementService } from "@/services/hybrid/movementService"
import { useAuth } from "@/context/AuthContext"
import { useToast } from "@/components/ui/use-toast"
import { ProductSelector } from "@/components/movements/ProductSelector"
import { SupplierSelector } from "@/components/movements/SupplierSelector"
import { useFirebaseStorage } from "@/hooks/useFirebaseStorage"
import { cn } from "@/lib/utils"

const formSchema = z.object({
  type: z.enum(["purchase", "stock_in", "stock_out"]),
  date: z.date(),
  supplierId: z.string().optional(),
  currency: z.string().default("ARS"),
  notes: z.string().optional(),
  attachments: z.array(z.string()).default([]),
})

type MovementFormProps = {
  onSuccess?: () => void
  initialData?: Movement
}

export function MovementForm({ onSuccess, initialData }: MovementFormProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const { uploadFile, isUploading } = useFirebaseStorage()

  const [items, setItems] = useState<MovementItem[]>(initialData?.items || [])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [attachments, setAttachments] = useState<string[]>(initialData?.attachments || [])
  const [uploadProgress, setUploadProgress] = useState(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialData?.type || "purchase",
      date: initialData?.date instanceof Date ? initialData.date : new Date(),
      supplierId: initialData?.supplierId || "",
      currency: initialData?.currency || "ARS",
      notes: initialData?.notes || "",
      attachments: initialData?.attachments || [],
    },
  })

  const watchType = form.watch("type")

  const handleAddItem = (newItem: MovementItem) => {
    setItems((prev) => [...prev, newItem])
  }

  const handleRemoveItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return

    try {
      const file = event.target.files[0]
      const path = `movements/${Date.now()}_${file.name}`

      const url = await uploadFile(file, path, (progress) => {
        setUploadProgress(progress)
      })

      setAttachments((prev) => [...prev, url])
      form.setValue("attachments", [...attachments, url])

      toast({
        title: "Archivo subido",
        description: "El archivo se ha subido correctamente",
      })
    } catch (error) {
      console.error("Error uploading file:", error)
      toast({
        title: "Error",
        description: "No se pudo subir el archivo",
        variant: "destructive",
      })
    } finally {
      setUploadProgress(0)
    }
  }

  const handleRemoveAttachment = (index: number) => {
    const newAttachments = attachments.filter((_, i) => i !== index)
    setAttachments(newAttachments)
    form.setValue("attachments", newAttachments)
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Debes iniciar sesión para realizar esta acción",
        variant: "destructive",
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos un producto",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const formData: MovementFormData = {
        ...data,
        items,
        attachments,
      }

      if (initialData?.id) {
        await movementService.update(initialData.id, formData)
        toast({
          title: "Movimiento actualizado",
          description: "El movimiento se ha actualizado correctamente",
        })
      } else {
        await movementService.create(formData, user.uid)
        toast({
          title: "Movimiento registrado",
          description: "El movimiento se ha registrado correctamente",
        })
      }

      if (onSuccess) {
        onSuccess()
      }

      // Reset form if it's a new movement
      if (!initialData) {
        form.reset({
          type: "purchase",
          date: new Date(),
          supplierId: "",
          currency: "ARS",
          notes: "",
          attachments: [],
        })
        setItems([])
        setAttachments([])
      }
    } catch (error) {
      console.error("Error submitting movement:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el movimiento",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0)

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{initialData ? "Editar Movimiento" : "Registrar Nuevo Movimiento"}</CardTitle>
            <CardDescription>Registra movimientos de mercadería y compras a proveedores</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Movimiento</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(movementTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {watchType === "purchase" && (
              <FormField
                control={form.control}
                name="supplierId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor</FormLabel>
                    <FormControl>
                      <SupplierSelector value={field.value} onChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Productos</h3>
                <ProductSelector onSelect={handleAddItem} />
              </div>

              {items.length > 0 ? (
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
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {items.map((item, index) => (
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button variant="ghost" size="sm" onClick={() => handleRemoveItem(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium">
                          Total:
                        </td>
                        <td className="px-6 py-3 text-left text-sm font-bold">${totalAmount.toFixed(2)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              ) : (
                <div className="text-center p-4 border border-dashed rounded-md">
                  <p className="text-gray-500">No hay productos agregados</p>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="ARS">Peso Argentino (ARS)</SelectItem>
                      <SelectItem value="USD">Dólar Estadounidense (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Agrega notas o comentarios sobre este movimiento" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Adjuntos</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("file-upload")?.click()}
                  disabled={isUploading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Archivo
                </Button>
                {isUploading && <span className="text-sm text-gray-500">Subiendo... {uploadProgress}%</span>}
              </div>

              {attachments.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                  {attachments.map((url, index) => (
                    <div key={index} className="relative group border rounded-md overflow-hidden">
                      {url.toLowerCase().endsWith(".pdf") ? (
                        <div className="flex items-center justify-center h-24 bg-gray-100">
                          <span className="text-sm">Documento PDF</span>
                        </div>
                      ) : (
                        <img
                          src={url || "/placeholder.svg"}
                          alt={`Adjunto ${index + 1}`}
                          className="h-24 w-full object-cover"
                        />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveAttachment(index)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : initialData ? "Actualizar" : "Registrar Movimiento"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  )
}
