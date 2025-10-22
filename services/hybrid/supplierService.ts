import { getDatabaseProvider } from "@/lib/database-config"
import type { Supplier, SupplierFormData } from "@/models/Supplier"

// Servicio híbrido que usa Firebase o MongoDB según la configuración
export async function getAllSuppliers(): Promise<Supplier[]> {
  const provider = getDatabaseProvider()
  
  // En el navegador o cuando se usa MongoDB, usar Firebase por ahora
  // TODO: Crear API route para suppliers
  const firebaseSupplierService = await import("../api/supplierService")
  return await firebaseSupplierService.supplierService.getAll()
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const provider = getDatabaseProvider()
  
  const firebaseSupplierService = await import("../api/supplierService")
  return await firebaseSupplierService.supplierService.getById(id)
}

export async function createSupplier(supplierData: SupplierFormData): Promise<string | null> {
  const provider = getDatabaseProvider()
  
  const firebaseSupplierService = await import("../api/supplierService")
  const id = await firebaseSupplierService.supplierService.create(supplierData)
  return id
}

export async function updateSupplier(id: string, supplierData: SupplierFormData): Promise<boolean> {
  const provider = getDatabaseProvider()
  
  const firebaseSupplierService = await import("../api/supplierService")
  await firebaseSupplierService.supplierService.update(id, supplierData)
  return true
}

export async function deleteSupplier(id: string): Promise<boolean> {
  const provider = getDatabaseProvider()
  
  const firebaseSupplierService = await import("../api/supplierService")
  await firebaseSupplierService.supplierService.delete(id)
  return true
}
