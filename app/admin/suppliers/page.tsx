import { SupplierList } from "@/components/suppliers/SupplierList"

export default function SuppliersPage() {
  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-4 sm:mb-0">Gestión de Proveedores</h1>
      </div>

      <SupplierList />
    </div>
  )
}
