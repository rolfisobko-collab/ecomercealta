import { getDatabaseProvider } from "@/lib/database-config"

const isBrowser = typeof window !== 'undefined'

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) throw new Error(await res.text())
  // Handle 204/empty body safely
  const text = await res.text()
  if (!text) return undefined as T
  try {
    return JSON.parse(text) as T
  } catch {
    return undefined as T
  }
}

function createPoller<T>(path: string, cb: (data: T) => void, intervalMs = 5000) {
  let timer: any
  let stopped = false
  const tick = async () => {
    try {
      const data = await api<T>(path)
      if (!stopped) cb(data)
    } catch {}
    if (!stopped) timer = setTimeout(tick, intervalMs)
  }
  tick()
  return () => { stopped = true; if (timer) clearTimeout(timer) }
}

export const technicalServiceService = {
  // Services
  async getAll() {
    if (isBrowser) return api<any[]>(`/api/technical-services`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getAll()
  },
  onSnapshot(callback: (services: any[]) => void) {
    if (isBrowser) return createPoller<any[]>(`/api/technical-services`, callback, 7000)
    ;(async () => {
      const mod = await import("../mongodb/technicalServiceService")
      const list = await mod.technicalServiceServiceMongo.getAll()
      callback(list)
    })()
    return () => {}
  },
  async getById(id: string) {
    if (isBrowser) return api<any>(`/api/technical-services/${id}`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getById(id)
  },
  async create(data: any) {
    if (isBrowser) return api<string>(`/api/technical-services`, { method: 'POST', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.create(data)
  },
  async update(id: string, data: any) {
    if (isBrowser) return api<void>(`/api/technical-services/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.update(id, data)
  },
  async delete(id: string) {
    if (isBrowser) return api<void>(`/api/technical-services/${id}`, { method: 'DELETE' })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.delete(id)
  },

  // Brands
  async createBrand(data: any) {
    if (isBrowser) return api<string>(`/api/service-brands`, { method: 'POST', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.createBrand(data)
  },
  async getAllBrands() {
    if (isBrowser) return api<any[]>(`/api/service-brands`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getAllBrands()
  },
  async updateBrand(id: string, data: any) {
    if (isBrowser) return api<void>(`/api/service-brands/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.updateBrand(id, data)
  },
  async deleteBrand(id: string) {
    if (isBrowser) return api<void>(`/api/service-brands/${id}`, { method: 'DELETE' })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.deleteBrand(id)
  },

  // Models
  async createModel(data: any) {
    if (isBrowser) return api<string>(`/api/service-models`, { method: 'POST', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.createModel(data)
  },
  async getAllModels() {
    if (isBrowser) return api<any[]>(`/api/service-models`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getAllModels()
  },
  async getModelsByBrand(brandId: string) {
    if (isBrowser) return api<any[]>(`/api/service-models?brandId=${encodeURIComponent(brandId)}`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getModelsByBrand(brandId)
  },
  async updateModel(id: string, data: any) {
    if (isBrowser) return api<void>(`/api/service-models/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.updateModel(id, data)
  },
  async deleteModel(id: string) {
    if (isBrowser) return api<void>(`/api/service-models/${id}`, { method: 'DELETE' })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.deleteModel(id)
  },
  // Polling snapshots for brands and models
  onBrandsSnapshot(callback: (brands: any[]) => void) {
    if (isBrowser) return createPoller<any[]>(`/api/service-brands`, callback, 7000)
    ;(async () => {
      const mod = await import("../mongodb/technicalServiceService")
      const list = await mod.technicalServiceServiceMongo.getAllBrands()
      callback(list)
    })()
    return () => {}
  },
  onModelsSnapshot(callback: (models: any[]) => void) {
    if (isBrowser) return createPoller<any[]>(`/api/service-models`, callback, 7000)
    ;(async () => {
      const mod = await import("../mongodb/technicalServiceService")
      const list = await mod.technicalServiceServiceMongo.getAllModels()
      callback(list)
    })()
    return () => {}
  },

  // Specifications
  async createSpecification(data: any) {
    if (isBrowser) return api<string>(`/api/service-specifications`, { method: 'POST', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.createSpecification(data)
  },
  async updateSpecification(id: string, data: any) {
    if (isBrowser) return api<void>(`/api/service-specifications/${id}`, { method: 'PATCH', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.updateSpecification(id, data)
  },
  async getSpecificationsByService(serviceId: string) {
    if (isBrowser) return api<any[]>(`/api/service-specifications?serviceId=${encodeURIComponent(serviceId)}`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getSpecificationsByService(serviceId)
  },
  async getSpecificationsByBrandAndModel(brandId: string, modelId: string) {
    if (isBrowser) return api<any[]>(`/api/service-specifications?brandId=${encodeURIComponent(brandId)}&modelId=${encodeURIComponent(modelId)}`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getSpecificationsByBrandAndModel(brandId, modelId)
  },
  async upsertSpecification(data: any) {
    if (isBrowser) return api<string>(`/api/service-specifications`, { method: 'PUT', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.upsertSpecification(data)
  },

  // Service Products
  async addServiceProduct(data: any) {
    if (isBrowser) return api<string>(`/api/service-products`, { method: 'POST', body: JSON.stringify(data) })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.addServiceProduct(data)
  },
  async removeServiceProduct(id: string) {
    if (isBrowser) return api<void>(`/api/service-products/${id}`, { method: 'DELETE' })
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.removeServiceProduct(id)
  },
  async getServiceProductsByService(serviceId: string) {
    if (isBrowser) return api<any[]>(`/api/service-products?serviceId=${encodeURIComponent(serviceId)}`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getServiceProductsByService(serviceId)
  },
  async getAllServiceProducts() {
    if (isBrowser) return api<Record<string, any[]>>(`/api/service-products`)
    const mod = await import("../mongodb/technicalServiceService")
    return mod.technicalServiceServiceMongo.getAllServiceProducts()
  },
}
