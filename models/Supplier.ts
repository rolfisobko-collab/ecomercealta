export interface Supplier {
  id: string
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  category: string
  notes: string
  active: boolean
  createdAt: Date | null
  updatedAt: Date | null
}

export interface SupplierFormData {
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  category: string
  notes: string
  active: boolean
}

export const supplierCategories = [
  { value: "repuestos", label: "Repuestos" },
  { value: "accesorios", label: "Accesorios" },
  { value: "herramientas", label: "Herramientas" },
  { value: "servicios", label: "Servicios" },
  { value: "otros", label: "Otros" },
]

export const getCategoryColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case "repuestos":
      return "bg-blue-100 text-blue-800"
    case "accesorios":
      return "bg-purple-100 text-purple-800"
    case "herramientas":
      return "bg-yellow-100 text-yellow-800"
    case "servicios":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
