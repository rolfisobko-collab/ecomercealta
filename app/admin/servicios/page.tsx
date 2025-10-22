"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Clock,
  DollarSign,
  Smartphone,
  Tag,
  Save,
  Package,
  ShoppingCart,
  Minus,
  Search,
  Filter,
} from "lucide-react"
import { technicalServiceService } from "@/services/hybrid/technicalServiceService"
import { productService } from "@/services/hybrid/productService"
import { getAllCategories } from "@/services/hybrid/categoryService"
import type {
  CreateTechnicalServiceData,
  ServiceBrand,
  ServiceModel,
  CreateServiceBrandData,
  CreateServiceModelData,
  ServiceSpecification,
  CreateServiceSpecificationData,
  TechnicalServiceWithProducts,
} from "@/models/TechnicalService"
import type { Product } from "@/models/Product"

const SERVICE_CATEGORIES = ["Pantalla", "Batería", "Cámara", "Audio", "Conectividad", "Software", "Hardware", "Otros"]

interface ServiceProductForm {
  productId: string
  quantity: number
  isOptional: boolean
  tempId: string // Para identificar productos antes de guardar
}

// Componente de búsqueda de productos
interface ProductSearchProps {
  products: Product[]
  selectedProductId: string
  onProductSelect: (productId: string) => void
  excludeProductIds?: string[]
}

function ProductSearch({ products, selectedProductId, onProductSelect, excludeProductIds = [] }: ProductSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [categoryIdToName, setCategoryIdToName] = useState<Record<string, string>>({})
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    let active = true
    const loadCats = async () => {
      try {
        const cats = await getAllCategories()
        if (!active) return
        const map: Record<string, string> = {}
        for (const c of cats) {
          map[String((c as any).id ?? (c as any)._id ?? "")] = c.name
        }
        setCategoryIdToName(map)
      } catch {}
    }
    loadCats()
    return () => { active = false }
  }, [])

  // Obtener categorías únicas por nombre legible
  const productCategories = useMemo(() => {
    const names = new Set<string>()
    for (const p of products) {
      const name = categoryIdToName[(p as any).categoryId || (p as any).category] || (p as any).categoryName || ""
      if (name) names.add(name)
    }
    return Array.from(names).sort()
  }, [products, categoryIdToName])

  // Filtrar productos basado en búsqueda y categoría
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Excluir productos ya seleccionados
      if (excludeProductIds.includes(product.id)) return false

      // Filtro por término de búsqueda
      const matchesSearch =
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (String((product as any)?.sku || "").toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtro por categoría
      const catName = categoryIdToName[(product as any).categoryId || (product as any).category] || (product as any).categoryName
      const matchesCategory = selectedCategory === "all" || catName === selectedCategory

      return matchesSearch && matchesCategory
    })
  }, [products, searchTerm, selectedCategory, excludeProductIds, categoryIdToName])

  const selectedProduct = products.find((p) => p.id === selectedProductId)
  const selectedProductCategoryName = selectedProduct ? (categoryIdToName[(selectedProduct as any).categoryId || (selectedProduct as any).category] || (selectedProduct as any).categoryName || "-") : "-"

  const handleProductSelect = (product: Product) => {
    onProductSelect(product.id)
    setIsOpen(false)
    setSearchTerm("")
  }

  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold text-gray-700">Producto/Repuesto</Label>

      {/* Campo de selección actual */}
      <div
        className="border-2 border-orange-200 rounded-md p-3 cursor-pointer hover:border-orange-300 transition-colors bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedProduct ? (
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-gray-900">{selectedProduct.name}</p>
              <p className="text-sm text-gray-500">
                ${Number((selectedProduct as any)?.price ?? 0).toFixed(2)} - {selectedProductCategoryName}
              </p>
            </div>
            <Badge variant="outline" className="bg-orange-50 text-orange-700">
              Seleccionado
            </Badge>
          </div>
        ) : (
          <div className="flex items-center text-gray-500">
            <Search className="h-4 w-4 mr-2" />
            <span>Buscar y seleccionar producto...</span>
          </div>
        )}
      </div>

      {/* Panel de búsqueda */}
      {isOpen && (
        <Card className="border-2 border-orange-200 shadow-lg">
          <CardHeader className="pb-3">
            <div className="space-y-3">
              {/* Buscador */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nombre, descripción o SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-2 border-orange-200 focus:border-orange-500"
                />
              </div>

              {/* Filtro por categoría */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-48 border-2 border-orange-200 focus:border-orange-500">
                    <SelectValue placeholder="Filtrar por categoría">
                      {selectedCategory === "all" ? "Todas las categorías" : selectedCategory}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {productCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Contador de resultados */}
                <Badge variant="secondary" className="ml-auto">
                  {filteredProducts.length} productos
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 cursor-pointer transition-all duration-200"
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{product.name || "Sin nombre"}</h4>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{product.description}</p>
                          )}
                          <div className="flex items-center space-x-3 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {categoryIdToName[(product as any).categoryId || (product as any).category] || (product as any).categoryName || "-"}
                            </Badge>
                            {(product as any)?.sku && <span className="text-xs text-gray-500">SKU: {(product as any).sku}</span>}
                            <span className="text-xs text-gray-500">Stock: {Number((product as any)?.stock ?? 0)}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="font-bold text-green-600">${Number((product as any)?.price ?? 0).toFixed(2)}</p>
                          {product.stock <= 5 && (
                            <Badge variant="destructive" className="text-xs mt-1">
                              Stock bajo
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No se encontraron productos</p>
                    <p className="text-sm mt-1">Intenta con otros términos de búsqueda</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Botón para cerrar */}
            <div className="flex justify-end mt-4 pt-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="border-orange-200 hover:border-orange-300"
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default function ServiciosPage() {
  const [services, setServices] = useState<TechnicalServiceWithProducts[]>([])
  const [brands, setBrands] = useState<ServiceBrand[]>([])
  const [models, setModels] = useState<ServiceModel[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [specifications, setSpecifications] = useState<ServiceSpecification[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isBrandDialogOpen, setIsBrandDialogOpen] = useState(false)
  const [isModelDialogOpen, setIsModelDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<TechnicalServiceWithProducts | null>(null)
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")
  const [savingSpecifications, setSavingSpecifications] = useState(false)
  const { toast } = useToast()

  const [selectedBrand, setSelectedBrand] = useState("")
  const [selectedModel, setSelectedModel] = useState("")

  const [formData, setFormData] = useState<CreateTechnicalServiceData>({
    name: "",
    description: "",
    estimatedTime: 30,
    basePrice: 0,
    category: "",
    brandId: "",
    modelId: "",
    isActive: true,
  })

  // Estado para productos del formulario
  const [formProducts, setFormProducts] = useState<ServiceProductForm[]>([])
  const [newProduct, setNewProduct] = useState<ServiceProductForm>({
    productId: "",
    quantity: 1,
    isOptional: false,
    tempId: "",
  })

  const [brandFormData, setBrandFormData] = useState<CreateServiceBrandData>({
    name: "",
    logoUrl: "",
  })

  const [modelFormData, setModelFormData] = useState<CreateServiceModelData>({
    name: "",
    brandId: "",
  })

  // Estado para manejar las especificaciones localmente
  const [localSpecifications, setLocalSpecifications] = useState<{
    [serviceId: string]: { isActive: boolean; specificPrice: number }
  }>({})

  const [editingBrand, setEditingBrand] = useState<ServiceBrand | null>(null)
  const [editingModel, setEditingModel] = useState<ServiceModel | null>(null)

  const loadData = async () => {
    try {
      setLoading(true)
      const [servicesData, productsData, serviceProductsGrouped] = await Promise.all([
        technicalServiceService.getAll(),
        productService.getAll(),
        technicalServiceService.getAllServiceProducts(),
      ])
      // Adjuntar productos por servicio (si existen)
      const servicesWith: TechnicalServiceWithProducts[] = (servicesData as any[]).map((s: any) => ({
        ...s,
        products: (serviceProductsGrouped[s.id] || []).map((p: any) => ({
          id: p.id,
          serviceId: p.serviceId,
          productId: p.productId,
          quantity: p.quantity,
          isOptional: p.isOptional,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        })),
      }))
      setServices(servicesWith)
      setProducts(productsData)
    } catch (error) {
      console.error("Error loading data:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    const unsubscribeBrands = technicalServiceService.onBrandsSnapshot((brandsData) => {
      setBrands(brandsData)
    })

    const unsubscribeModels = technicalServiceService.onModelsSnapshot((modelsData) => {
      setModels(modelsData)
    })

    return () => {
      unsubscribeBrands()
      unsubscribeModels()
    }
  }, [])

  // Cargar especificaciones cuando se selecciona marca y modelo
  useEffect(() => {
    if (selectedBrand && selectedModel) {
      loadSpecifications()
    } else {
      setSpecifications([])
      setLocalSpecifications({})
    }
  }, [selectedBrand, selectedModel])

  const loadSpecifications = async () => {
    if (!selectedBrand || !selectedModel) return

    try {
      const specs = await technicalServiceService.getSpecificationsByBrandAndModel(selectedBrand, selectedModel)
      setSpecifications(specs)

      // Inicializar especificaciones locales
      const localSpecs: { [serviceId: string]: { isActive: boolean; specificPrice: number } } = {}

      services.forEach((service) => {
        const existingSpec = specs.find((spec) => spec.serviceId === service.id)
        localSpecs[service.id] = {
          isActive: existingSpec?.isActive ?? true,
          specificPrice: existingSpec?.specificPrice ?? service.basePrice,
        }
      })

      setLocalSpecifications(localSpecs)
    } catch (error) {
      console.error("Error loading specifications:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las especificaciones",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      estimatedTime: 30,
      basePrice: 0,
      category: "",
      brandId: "",
      modelId: "",
      isActive: true,
    })
    setFormProducts([])
    setNewProduct({
      productId: "",
      quantity: 1,
      isOptional: false,
      tempId: "",
    })
  }

  const addProductToForm = () => {
    if (!newProduct.productId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un producto",
        variant: "destructive",
      })
      return
    }

    // Verificar si el producto ya está agregado
    if (formProducts.some((p) => p.productId === newProduct.productId)) {
      toast({
        title: "Error",
        description: "Este producto ya está agregado al servicio",
        variant: "destructive",
      })
      return
    }

    const productToAdd: ServiceProductForm = {
      ...newProduct,
      tempId: Date.now().toString(),
    }

    setFormProducts([...formProducts, productToAdd])
    setNewProduct({
      productId: "",
      quantity: 1,
      isOptional: false,
      tempId: "",
    })
  }

  const removeProductFromForm = (tempId: string) => {
    setFormProducts(formProducts.filter((p) => p.tempId !== tempId))
  }

  const updateProductInForm = (tempId: string, field: keyof ServiceProductForm, value: any) => {
    setFormProducts(formProducts.map((p) => (p.tempId === tempId ? { ...p, [field]: value } : p)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.category) {
      toast({
        title: "Error",
        description: "El nombre y la categoría son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description,
        estimatedTime: formData.estimatedTime,
        basePrice: formData.basePrice,
        category: formData.category,
        isActive: formData.isActive,
        ...(formData.brandId && { brandId: formData.brandId }),
        ...(formData.modelId && { modelId: formData.modelId }),
      }

      let serviceId: string

      if (editingService) {
        await technicalServiceService.update(editingService.id, {
          ...serviceData,
          lastManualUpdate: new Date(),
        })
        serviceId = editingService.id

        // Eliminar productos existentes del servicio
        if (editingService.products) {
          await Promise.all(
            editingService.products.map((product) => technicalServiceService.removeServiceProduct(product.id)),
          )
        }

        toast({
          title: "Servicio actualizado",
          description: "El servicio técnico ha sido actualizado correctamente",
        })
      } else {
        serviceId = await technicalServiceService.create(serviceData)
        toast({
          title: "Servicio creado",
          description: "El servicio técnico ha sido creado correctamente",
        })
      }

      // Agregar productos al servicio
      if (formProducts.length > 0) {
        await Promise.all(
          formProducts.map((product) =>
            technicalServiceService.addServiceProduct({
              serviceId,
              productId: product.productId,
              quantity: product.quantity,
              isOptional: product.isOptional,
            }),
          ),
        )
      }

      setIsDialogOpen(false)
      setEditingService(null)
      resetForm()
      await loadData()
    } catch (error) {
      console.error("Error saving service:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el servicio técnico",
        variant: "destructive",
      })
    }
  }

  const handleEditBrand = (brand: ServiceBrand) => {
    setEditingBrand(brand)
    setBrandFormData({
      name: brand.name,
      logoUrl: brand.logoUrl || "",
    })
    setIsBrandDialogOpen(true)
  }

  const handleDeleteBrand = async (brand: ServiceBrand) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la marca "${brand.name}"?`)) {
      return
    }

    try {
      await technicalServiceService.deleteBrand(brand.id)
      toast({
        title: "Marca eliminada",
        description: "La marca ha sido eliminada correctamente",
      })
    } catch (error) {
      console.error("Error deleting brand:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la marca",
      })
    }
  }

  const handleEditModel = (model: ServiceModel) => {
    setEditingModel(model)
    setModelFormData({
      name: model.name,
      brandId: model.brandId,
    })
    setIsModelDialogOpen(true)
  }

  const handleDeleteModel = async (model: ServiceModel) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el modelo "${model.name}"?`)) {
      return
    }

    try {
      await technicalServiceService.deleteModel(model.id)
      toast({
        title: "Modelo eliminado",
        description: "El modelo ha sido eliminado correctamente",
      })
    } catch (error) {
      console.error("Error deleting model:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el modelo",
      })
    }
  }

  const handleBrandSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!brandFormData.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la marca es obligatorio",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingBrand) {
        await technicalServiceService.updateBrand(editingBrand.id, brandFormData)
        toast({
          title: "Marca actualizada",
          description: "La marca ha sido actualizada correctamente",
        })
      } else {
        await technicalServiceService.createBrand(brandFormData)
        toast({
          title: "Marca creada",
          description: "La marca ha sido creada correctamente",
        })
      }
      setIsBrandDialogOpen(false)
      setEditingBrand(null)
      setBrandFormData({ name: "", logoUrl: "" })
    } catch (error) {
      console.error("Error saving brand:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la marca",
      })
    }
  }

  const handleModelSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!modelFormData.name.trim() || !modelFormData.brandId) {
      toast({
        title: "Error",
        description: "El nombre del modelo y la marca son obligatorios",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingModel) {
        await technicalServiceService.updateModel(editingModel.id, modelFormData)
        toast({
          title: "Modelo actualizado",
          description: "El modelo ha sido actualizado correctamente",
        })
      } else {
        await technicalServiceService.createModel(modelFormData)
        toast({
          title: "Modelo creado",
          description: "El modelo ha sido creado correctamente",
        })
      }
      setIsModelDialogOpen(false)
      setEditingModel(null)
      setModelFormData({ name: "", brandId: "" })
    } catch (error) {
      console.error("Error saving model:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el modelo",
      })
    }
  }

  const handleEdit = (service: TechnicalServiceWithProducts) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      description: service.description,
      estimatedTime: service.estimatedTime,
      basePrice: service.basePrice,
      category: service.category,
      brandId: service.brandId || "",
      modelId: service.modelId || "",
      isActive: service.isActive,
    })

    // Cargar productos existentes del servicio
    if (service.products) {
      const existingProducts: ServiceProductForm[] = service.products.map((product, index) => ({
        productId: product.productId,
        quantity: product.quantity,
        isOptional: product.isOptional,
        tempId: `existing-${index}`,
      }))
      setFormProducts(existingProducts)
    } else {
      setFormProducts([])
    }

    setIsDialogOpen(true)
  }

  const handleDelete = async (service: TechnicalServiceWithProducts) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar el servicio "${service.name}"?`)) {
      return
    }

    try {
      await technicalServiceService.delete(service.id)
      toast({
        title: "Servicio eliminado",
        description: "El servicio técnico ha sido eliminado correctamente",
      })
      await loadData()
    } catch (error) {
      console.error("Error deleting service:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el servicio técnico",
      })
    }
  }

  const startEditing = (id: string, field: string, currentValue: any) => {
    setEditingField({ id, field })
    setEditValue(String(currentValue))
  }

  const handleSave = async () => {
    if (!editingField) return

    try {
      const updateData: any = {
        [editingField.field]:
          editingField.field === "estimatedTime" || editingField.field === "basePrice" ? Number(editValue) : editValue,
        lastManualUpdate: new Date(),
      }

      await technicalServiceService.update(editingField.id, updateData)

      toast({
        title: "Campo actualizado",
        description: "El campo ha sido actualizado correctamente",
      })

      setEditingField(null)
      setEditValue("")
      await loadData()
    } catch (error) {
      console.error("Error updating field:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el campo",
      })
    }
  }

  const handleCancel = () => {
    setEditingField(null)
    setEditValue("")
  }

  const handleSpecificationChange = (
    serviceId: string,
    field: "isActive" | "specificPrice",
    value: boolean | number,
  ) => {
    setLocalSpecifications((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        [field]: value,
      },
    }))
  }

  const saveSpecifications = async () => {
    if (!selectedBrand || !selectedModel) return

    setSavingSpecifications(true)
    try {
      const promises = Object.entries(localSpecifications).map(([serviceId, spec]) => {
        const specData: CreateServiceSpecificationData = {
          serviceId,
          brandId: selectedBrand,
          modelId: selectedModel,
          isActive: spec.isActive,
          specificPrice: spec.specificPrice,
        }
        return technicalServiceService.upsertSpecification(specData)
      })

      await Promise.all(promises)

      toast({
        title: "Especificaciones guardadas",
        description: "Las especificaciones han sido guardadas correctamente",
      })

      await loadSpecifications()
    } catch (error) {
      console.error("Error saving specifications:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar las especificaciones",
      })
    } finally {
      setSavingSpecifications(false)
    }
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const getBrandName = (brandId?: string) => {
    if (!brandId) return "Todas las marcas"
    const brand = brands.find((b) => b.id === brandId)
    return brand?.name || "Marca desconocida"
  }

  const getModelName = (modelId?: string) => {
    if (!modelId) return "Todos los modelos"
    const model = models.find((m) => m.id === modelId)
    return model?.name || "Modelo desconocido"
  }

  const getFilteredModels = (brandId: string) => {
    return models.filter((model) => model.brandId === brandId)
  }

  const getBrandLogo = (brandId: string) => {
    const brand = brands.find((b) => b.id === brandId)
    return brand?.logoUrl
  }

  const getProductName = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product?.name || "Producto no encontrado"
  }

  const getProductPrice = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product?.price || 0
  }

  const calculateTotalProductsPrice = (serviceProducts: ServiceProductForm[]) => {
    return serviceProducts.reduce((total, serviceProduct) => {
      const productPrice = getProductPrice(serviceProduct.productId)
      return total + productPrice * serviceProduct.quantity
    }, 0)
  }

  // Obtener IDs de productos ya seleccionados para excluir del buscador
  const excludeProductIds = formProducts.map((p) => p.productId)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          {/* Gestionar Marcas Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Tag className="h-5 w-5 mr-2" />
                Gestionar Marcas
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                  <Tag className="h-6 w-6 mr-2 text-blue-600" />
                  Gestión de Marcas
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Create/Edit Brand Form */}
                <Card className="border-2 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-900">
                      {editingBrand ? "Editar Marca" : "Nueva Marca"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleBrandSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="brandName" className="text-sm font-semibold text-gray-700">
                            Nombre de la Marca
                          </Label>
                          <Input
                            id="brandName"
                            value={brandFormData.name}
                            onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                            placeholder="Ej: Samsung, Apple, Xiaomi"
                            className="mt-1 border-2 border-blue-200 focus:border-blue-500"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="brandLogo" className="text-sm font-semibold text-gray-700">
                            URL del Logo
                          </Label>
                          <Input
                            id="brandLogo"
                            value={brandFormData.logoUrl}
                            onChange={(e) => setBrandFormData({ ...brandFormData, logoUrl: e.target.value })}
                            placeholder="https://ejemplo.com/logo.png"
                            className="mt-1 border-2 border-blue-200 focus:border-blue-500"
                          />
                        </div>
                      </div>
                      {brandFormData.logoUrl && (
                        <div className="flex justify-center">
                          <img
                            src={brandFormData.logoUrl || "/placeholder.svg"}
                            alt="Preview"
                            className="h-16 w-16 object-contain border-2 border-gray-200 rounded-lg shadow-sm"
                            onError={(e) => {
                              e.currentTarget.style.display = "none"
                            }}
                          />
                        </div>
                      )}
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingBrand(null)
                            setBrandFormData({ name: "", logoUrl: "" })
                          }}
                          className="border-2 border-gray-300"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                        >
                          {editingBrand ? "Actualizar" : "Crear"} Marca
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Brands List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Marcas Registradas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {brands.map((brand) => (
                        <Card
                          key={brand.id}
                          className="border-2 border-gray-100 hover:border-blue-300 transition-all duration-200 hover:shadow-md"
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3 mb-3">
                              {brand.logoUrl ? (
                                <img
                                  src={brand.logoUrl || "/placeholder.svg"}
                                  alt={brand.name}
                                  className="h-10 w-10 object-contain border border-gray-200 rounded"
                                />
                              ) : (
                                <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                  <Tag className="h-5 w-5 text-gray-500" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                                <p className="text-sm text-gray-500">{getFilteredModels(brand.id).length} modelos</p>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditBrand(brand)}
                                className="hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDeleteBrand(brand)}
                                className="hover:bg-red-50 hover:border-red-300 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {brands.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Tag className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No hay marcas registradas</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>

          {/* Gestionar Modelos Button */}
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
                <Smartphone className="h-5 w-5 mr-2" />
                Gestionar Modelos
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center">
                  <Smartphone className="h-6 w-6 mr-2 text-green-600" />
                  Gestión de Modelos
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                {/* Create/Edit Model Form */}
                <Card className="border-2 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
                  <CardHeader>
                    <CardTitle className="text-lg text-green-900">
                      {editingModel ? "Editar Modelo" : "Nuevo Modelo"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleModelSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="modelBrand" className="text-sm font-semibold text-gray-700">
                            Marca
                          </Label>
                          <Select
                            value={modelFormData.brandId}
                            onValueChange={(value) => setModelFormData({ ...modelFormData, brandId: value })}
                          >
                            <SelectTrigger className="mt-1 border-2 border-green-200 focus:border-green-500">
                              <SelectValue placeholder="Selecciona una marca" />
                            </SelectTrigger>
                            <SelectContent>
                              {brands.map((brand) => (
                                <SelectItem key={brand.id} value={brand.id}>
                                  <div className="flex items-center space-x-2">
                                    {brand.logoUrl && (
                                      <img
                                        src={brand.logoUrl || "/placeholder.svg"}
                                        alt={brand.name}
                                        className="h-4 w-4 object-contain"
                                      />
                                    )}
                                    <span>{brand.name}</span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="modelName" className="text-sm font-semibold text-gray-700">
                            Nombre del Modelo
                          </Label>
                          <Input
                            id="modelName"
                            value={modelFormData.name}
                            onChange={(e) => setModelFormData({ ...modelFormData, name: e.target.value })}
                            placeholder="Ej: iPhone 13, Galaxy S21"
                            className="mt-1 border-2 border-green-200 focus:border-green-500"
                            required
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-3">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            setEditingModel(null)
                            setModelFormData({ name: "", brandId: "" })
                          }}
                          className="border-2 border-gray-300"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                        >
                          {editingModel ? "Actualizar" : "Crear"} Modelo
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>

                {/* Models List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Modelos Registrados</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {brands.map((brand) => {
                        const brandModels = getFilteredModels(brand.id)
                        if (brandModels.length === 0) return null

                        return (
                          <div key={brand.id} className="border-2 border-gray-100 rounded-lg p-4">
                            <div className="flex items-center space-x-3 mb-4">
                              {brand.logoUrl && (
                                <img
                                  src={brand.logoUrl || "/placeholder.svg"}
                                  alt={brand.name}
                                  className="h-8 w-8 object-contain"
                                />
                              )}
                              <h3 className="text-lg font-semibold text-gray-900">{brand.name}</h3>
                              <Badge variant="secondary">{brandModels.length} modelos</Badge>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {brandModels.map((model) => (
                                <Card
                                  key={model.id}
                                  className="border border-gray-200 hover:border-green-300 transition-all duration-200"
                                >
                                  <CardContent className="p-3">
                                    <div className="flex items-center justify-between">
                                      <span className="font-medium text-gray-900">{model.name}</span>
                                      <div className="flex space-x-1">
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleEditModel(model)}
                                          className="h-8 w-8 p-0 hover:bg-green-50 hover:border-green-300"
                                        >
                                          <Edit2 className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleDeleteModel(model)}
                                          className="h-8 w-8 p-0 hover:bg-red-50 hover:border-red-300 text-red-600"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {models.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Smartphone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No hay modelos registrados</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </DialogContent>
          </Dialog>

          {/* Nuevo Servicio Button */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  setEditingService(null)
                  resetForm()
                }}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-purple-600" />
                  {editingService ? "Editar Servicio" : "Nuevo Servicio Técnico"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                      Nombre del Servicio
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Cambio de pantalla"
                      className="mt-1 border-2 border-purple-200 focus:border-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm font-semibold text-gray-700">
                      Categoría
                    </Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="mt-1 border-2 border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="Selecciona una categoría" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Marca y Modelo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brandId" className="text-sm font-semibold text-gray-700">
                      Marca (opcional)
                    </Label>
                    <Select
                      value={formData.brandId}
                      onValueChange={(value) => setFormData({ ...formData, brandId: value, modelId: "" })}
                    >
                      <SelectTrigger className="mt-1 border-2 border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder="Selecciona una marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="modelId" className="text-sm font-semibold text-gray-700">
                      Modelo (opcional)
                    </Label>
                    <Select
                      value={formData.modelId}
                      onValueChange={(value) => setFormData({ ...formData, modelId: value })}
                      disabled={!formData.brandId}
                    >
                      <SelectTrigger className="mt-1 border-2 border-purple-200 focus:border-purple-500">
                        <SelectValue placeholder={formData.brandId ? "Selecciona un modelo" : "Selecciona una marca primero"} />
                      </SelectTrigger>
                      <SelectContent>
                        {formData.brandId && getFilteredModels(formData.brandId).map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descripción del servicio..."
                    rows={3}
                    className="mt-1 border-2 border-purple-200 focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="estimatedTime" className="text-sm font-semibold text-gray-700">
                      Tiempo Estimado (min)
                    </Label>
                    <Input
                      id="estimatedTime"
                      type="number"
                      value={formData.estimatedTime}
                      onChange={(e) => setFormData({ ...formData, estimatedTime: Number(e.target.value) })}
                      min="1"
                      className="mt-1 border-2 border-purple-200 focus:border-purple-500"
                    />
                  </div>

                  <div>
                    <Label htmlFor="basePrice" className="text-sm font-semibold text-gray-700">
                      Precio Base (Mano de Obra)
                    </Label>
                    <Input
                      id="basePrice"
                      type="number"
                      value={formData.basePrice}
                      onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
                      min="0"
                      step="0.01"
                      className="mt-1 border-2 border-purple-200 focus:border-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <Label htmlFor="isActive" className="text-sm font-semibold text-gray-700">
                    Servicio activo
                  </Label>
                </div>

                <Separator />

                {/* Sección de Productos/Repuestos */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Productos/Repuestos Necesarios</h3>
                  </div>

                  {/* Agregar nuevo producto */}
                  <Card className="border-2 border-orange-100 bg-gradient-to-r from-orange-50 to-yellow-50">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
                        <div className="lg:col-span-2">
                          <ProductSearch
                            products={products}
                            selectedProductId={newProduct.productId}
                            onProductSelect={(productId) => setNewProduct({ ...newProduct, productId })}
                            excludeProductIds={excludeProductIds}
                          />
                        </div>

                        <div>
                          <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">
                            Cantidad
                          </Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={newProduct.quantity}
                            onChange={(e) => setNewProduct({ ...newProduct, quantity: Number(e.target.value) })}
                            min="1"
                            className="mt-1 border-2 border-orange-200 focus:border-orange-500"
                          />
                        </div>

                        <div className="flex flex-col space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="isOptional"
                              checked={newProduct.isOptional}
                              onCheckedChange={(checked) => setNewProduct({ ...newProduct, isOptional: checked })}
                            />
                            <Label htmlFor="isOptional" className="text-sm font-semibold text-gray-700">
                              Opcional
                            </Label>
                          </div>

                          <Button
                            type="button"
                            onClick={addProductToForm}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Agregar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de productos agregados */}
                  {formProducts.length > 0 && (
                    <Card className="border-2 border-gray-200">
                      <CardHeader>
                        <CardTitle className="text-md font-semibold text-gray-900 flex items-center">
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Productos Agregados ({formProducts.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {formProducts.map((product) => (
                            <div
                              key={product.tempId}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                            >
                              <div className="flex items-center space-x-4">
                                <div>
                                  <p className="font-medium text-gray-900">{getProductName(product.productId)}</p>
                                  <p className="text-sm text-gray-500">
                                    ${getProductPrice(product.productId).toFixed(2)} x {product.quantity} = $
                                    {(getProductPrice(product.productId) * product.quantity).toFixed(2)}
                                  </p>
                                </div>
                                <Badge
                                  variant={product.isOptional ? "secondary" : "default"}
                                  className={
                                    product.isOptional ? "bg-yellow-100 text-yellow-800" : "bg-blue-100 text-blue-800"
                                  }
                                >
                                  {product.isOptional ? "Opcional" : "Requerido"}
                                </Badge>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Input
                                  type="number"
                                  value={product.quantity}
                                  onChange={(e) =>
                                    updateProductInForm(product.tempId, "quantity", Number(e.target.value))
                                  }
                                  min="1"
                                  className="w-20 h-8"
                                />
                                <Switch
                                  checked={product.isOptional}
                                  onCheckedChange={(checked) =>
                                    updateProductInForm(product.tempId, "isOptional", checked)
                                  }
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removeProductFromForm(product.tempId)}
                                  className="hover:bg-red-50 hover:border-red-300 text-red-600"
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Resumen de costos */}
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-gray-600">Costo de Mano de Obra:</p>
                              <p className="text-sm text-gray-600">Costo de Repuestos:</p>
                              <p className="font-semibold text-gray-900">Costo Total Estimado:</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">${formData.basePrice.toFixed(2)}</p>
                              <p className="text-sm text-gray-600">
                                ${calculateTotalProductsPrice(formProducts).toFixed(2)}
                              </p>
                              <p className="font-semibold text-gray-900">
                                ${(formData.basePrice + calculateTotalProductsPrice(formProducts)).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    className="border-2 border-gray-300"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
                  >
                    {editingService ? "Actualizar" : "Crear"} Servicio
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Configuration Section */}
        <Card className="border-2 border-indigo-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 shadow-xl">
          <CardHeader className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg mb-4 mx-auto">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Configuración de Servicios</CardTitle>
            <CardDescription className="text-lg text-gray-600">
              Selecciona una marca y modelo para configurar servicios específicos y precios personalizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="selectedBrand" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-indigo-600" />
                  Seleccionar Marca
                </Label>
                <Select
                  value={selectedBrand}
                  onValueChange={(value) => {
                    setSelectedBrand(value)
                    setSelectedModel("")
                  }}
                >
                  <SelectTrigger className="h-12 border-2 border-indigo-200 focus:border-indigo-500 bg-white shadow-sm">
                    <SelectValue placeholder="Selecciona una marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        <div className="flex items-center space-x-3 py-1">
                          {brand.logoUrl && (
                            <img
                              src={brand.logoUrl || "/placeholder.svg"}
                              alt={brand.name}
                              className="h-6 w-6 object-contain"
                            />
                          )}
                          <span className="font-medium">{brand.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="selectedModel" className="text-sm font-semibold text-gray-700 flex items-center">
                  <Smartphone className="h-4 w-4 mr-2 text-purple-600" />
                  Seleccionar Modelo
                </Label>
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedBrand}>
                  <SelectTrigger className="h-12 border-2 border-purple-200 focus:border-purple-500 bg-white shadow-sm">
                    <SelectValue placeholder="Selecciona un modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedBrand &&
                      getFilteredModels(selectedBrand).map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <span className="font-medium">{model.name}</span>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {selectedBrand && selectedModel && (
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {getBrandLogo(selectedBrand) && (
                      <img
                        src={getBrandLogo(selectedBrand) || "/placeholder.svg"}
                        alt={getBrandName(selectedBrand)}
                        className="h-12 w-12 object-contain border-2 border-gray-200 rounded-lg p-1"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        {getBrandName(selectedBrand)} - {getModelName(selectedModel)}
                      </h3>
                      <p className="text-gray-600">Configurando servicios específicos</p>
                    </div>
                  </div>
                  <Button
                    onClick={saveSpecifications}
                    disabled={savingSpecifications}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    {savingSpecifications ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Guardando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Guardar Configuración
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Services Table */}
        <Card className="shadow-xl border-2 border-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
            <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Servicios Técnicos Registrados ({services.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-b-2 border-gray-200">
                    <TableHead className="font-bold text-gray-900">Servicio</TableHead>
                    <TableHead className="font-bold text-gray-900">Categoría</TableHead>
                    <TableHead className="font-bold text-gray-900">Tiempo</TableHead>
                    <TableHead className="font-bold text-gray-900">Precio Base</TableHead>
                    <TableHead className="font-bold text-gray-900">Productos</TableHead>
                    <TableHead className="font-bold text-gray-900">Estado</TableHead>
                    <TableHead className="font-bold text-gray-900">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <TableCell>
                        <div>
                          {editingField?.id === service.id && editingField?.field === "name" ? (
                            <div className="flex items-center space-x-2">
                              <Input
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="h-8 border-2 border-blue-300"
                                autoFocus
                              />
                              <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0 bg-green-600">
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancel}
                                className="h-8 w-8 p-0 bg-transparent"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div
                              className="cursor-pointer hover:bg-blue-50 p-1 rounded transition-colors"
                              onClick={() => startEditing(service.id, "name", service.name || "")}
                            >
                              <p className="font-semibold text-gray-900">{service.name || "Sin nombre"}</p>
                              {service.description && (
                                <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200"
                        >
                          {service.category || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {editingField?.id === service.id && editingField?.field === "estimatedTime" ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 w-20 border-2 border-blue-300"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0 bg-green-600">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="h-8 w-8 p-0 bg-transparent"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-blue-50 p-1 rounded transition-colors flex items-center"
                            onClick={() => startEditing(service.id, "estimatedTime", Number((service as any)?.estimatedTime ?? 0))}
                          >
                            <Clock className="h-4 w-4 mr-1 text-gray-500" />
                            <span className="font-medium">{formatTime(Number((service as any)?.estimatedTime ?? 0))}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingField?.id === service.id && editingField?.field === "basePrice" ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="number"
                              step="0.01"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 w-24 border-2 border-blue-300"
                              autoFocus
                            />
                            <Button size="sm" onClick={handleSave} className="h-8 w-8 p-0 bg-green-600">
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancel}
                              className="h-8 w-8 p-0 bg-transparent"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-blue-50 p-1 rounded transition-colors flex items-center"
                            onClick={() => startEditing(service.id, "basePrice", service.basePrice)}
                          >
                            <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                            <span className="font-semibold text-green-600">${Number((service as any)?.basePrice ?? 0).toFixed(2)}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {service.products && service.products.length > 0 ? (
                          <div className="space-y-1">
                            {service.products.slice(0, 2).map((product) => (
                              <div key={product.id} className="text-sm">
                                <span className="font-medium">{getProductName(product.productId)}</span>
                                <span className="text-gray-500 ml-1">
                                  (x{product.quantity}
                                  {product.isOptional && ", opcional"})
                                </span>
                              </div>
                            ))}
                            {service.products.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{service.products.length - 2} más
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Sin productos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={service.isActive ? "default" : "secondary"}
                          className={
                            service.isActive
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }
                        >
                          {service.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(service)}
                            className="hover:bg-blue-50 hover:border-blue-300"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(service)}
                            className="hover:bg-red-50 hover:border-red-300 text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {services.length === 0 && (
              <div className="text-center py-12">
                <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p className="text-xl text-gray-500 mb-2">No hay servicios técnicos registrados</p>
                <p className="text-gray-400">Crea tu primer servicio técnico para comenzar</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
