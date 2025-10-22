import { connectToMongoDB } from "@/lib/mongoose"
import {
  TechnicalService,
  ServiceProduct,
  ServiceBrand,
  ServiceModel,
  ServiceSpecification,
} from "@/models/mongodb/TechnicalService"

export const technicalServiceServiceMongo = {
  // Technical Services
  async create(data: any): Promise<string> {
    await connectToMongoDB()
    const doc = await TechnicalService.create({ ...data })
    return doc._id as unknown as string
  },

  async update(id: string, data: any): Promise<void> {
    await connectToMongoDB()
    await TechnicalService.updateOne({ _id: id }, { $set: { ...data } })
  },

  async delete(id: string): Promise<void> {
    await connectToMongoDB()
    await TechnicalService.deleteOne({ _id: id })
    await ServiceProduct.deleteMany({ serviceId: id })
    await ServiceSpecification.deleteMany({ serviceId: id })
  },

  async getAll(): Promise<any[]> {
    await connectToMongoDB()
    const services = await TechnicalService.find().sort({ name: 1 }).lean()
    return services.map((s: any) => ({
      id: s._id,
      name: s.name,
      description: s.description,
      estimatedTime: s.estimatedTime,
      basePrice: s.basePrice,
      category: s.category,
      brandId: s.brandId,
      modelId: s.modelId,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastManualUpdate: s.lastManualUpdate,
    }))
  },

  async getById(id: string): Promise<any | null> {
    await connectToMongoDB()
    const s: any = await TechnicalService.findById(id).lean()
    if (!s) return null
    return {
      id: s._id,
      name: s.name,
      description: s.description,
      estimatedTime: s.estimatedTime,
      basePrice: s.basePrice,
      category: s.category,
      brandId: s.brandId,
      modelId: s.modelId,
      isActive: s.isActive,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      lastManualUpdate: s.lastManualUpdate,
    }
  },

  // Brands
  async createBrand(data: any): Promise<string> {
    await connectToMongoDB()
    const doc = await ServiceBrand.create({ ...data })
    return doc._id as unknown as string
  },

  async getAllBrands(): Promise<any[]> {
    await connectToMongoDB()
    const brands = await ServiceBrand.find().sort({ name: 1 }).lean()
    return brands.map((b: any) => ({ id: b._id, name: b.name, logoUrl: b.logoUrl, createdAt: b.createdAt, updatedAt: b.updatedAt }))
  },

  async updateBrand(id: string, data: any): Promise<void> {
    await connectToMongoDB()
    await ServiceBrand.updateOne({ _id: id }, { $set: { ...data } })
  },

  async deleteBrand(id: string): Promise<void> {
    await connectToMongoDB()
    await ServiceBrand.deleteOne({ _id: id })
    await ServiceModel.deleteMany({ brandId: id })
    await ServiceSpecification.deleteMany({ brandId: id })
  },

  // Models
  async createModel(data: any): Promise<string> {
    await connectToMongoDB()
    const doc = await ServiceModel.create({ ...data })
    return doc._id as unknown as string
  },

  async getAllModels(): Promise<any[]> {
    await connectToMongoDB()
    const models = await ServiceModel.find().sort({ name: 1 }).lean()
    return models.map((m: any) => ({ id: m._id, name: m.name, brandId: m.brandId, createdAt: m.createdAt, updatedAt: m.updatedAt }))
  },

  async getModelsByBrand(brandId: string): Promise<any[]> {
    await connectToMongoDB()
    const models = await ServiceModel.find({ brandId }).sort({ name: 1 }).lean()
    return models.map((m: any) => ({ id: m._id, name: m.name, brandId: m.brandId, createdAt: m.createdAt, updatedAt: m.updatedAt }))
  },

  async updateModel(id: string, data: any): Promise<void> {
    await connectToMongoDB()
    await ServiceModel.updateOne({ _id: id }, { $set: { ...data } })
  },

  async deleteModel(id: string): Promise<void> {
    await connectToMongoDB()
    await ServiceModel.deleteOne({ _id: id })
    await ServiceSpecification.deleteMany({ modelId: id })
  },

  // Specifications
  async createSpecification(data: any): Promise<string> {
    await connectToMongoDB()
    const doc = await ServiceSpecification.create({ ...data })
    return doc._id as unknown as string
  },

  async updateSpecification(id: string, data: any): Promise<void> {
    await connectToMongoDB()
    await ServiceSpecification.updateOne({ _id: id }, { $set: { ...data } })
  },

  async getSpecificationsByService(serviceId: string): Promise<any[]> {
    await connectToMongoDB()
    const specs = await ServiceSpecification.find({ serviceId }).lean()
    return specs.map((s: any) => ({ id: s._id, serviceId: s.serviceId, brandId: s.brandId, modelId: s.modelId, isActive: s.isActive, specificPrice: s.specificPrice, createdAt: s.createdAt, updatedAt: s.updatedAt }))
  },

  async getSpecificationsByBrandAndModel(brandId: string, modelId: string): Promise<any[]> {
    await connectToMongoDB()
    const specs = await ServiceSpecification.find({ brandId, modelId }).lean()
    return specs.map((s: any) => ({ id: s._id, serviceId: s.serviceId, brandId: s.brandId, modelId: s.modelId, isActive: s.isActive, specificPrice: s.specificPrice, createdAt: s.createdAt, updatedAt: s.updatedAt }))
  },

  async upsertSpecification(data: { serviceId: string; brandId: string; modelId: string; isActive: boolean; specificPrice: number }): Promise<string> {
    await connectToMongoDB()
    const existing = await ServiceSpecification.findOne({ serviceId: data.serviceId, brandId: data.brandId, modelId: data.modelId })
    if (existing) {
      await ServiceSpecification.updateOne({ _id: existing._id }, { $set: { isActive: data.isActive, specificPrice: data.specificPrice } })
      return existing._id as unknown as string
    }
    const created = await ServiceSpecification.create({ ...data })
    return created._id as unknown as string
  },

  // Service Products
  async addServiceProduct(data: { serviceId: string; productId: string; quantity: number; isOptional: boolean }): Promise<string> {
    await connectToMongoDB()
    const doc = await ServiceProduct.create({ ...data })
    return doc._id as unknown as string
  },

  async removeServiceProduct(id: string): Promise<void> {
    await connectToMongoDB()
    await ServiceProduct.deleteOne({ _id: id })
  },

  async getServiceProductsByService(serviceId: string): Promise<any[]> {
    await connectToMongoDB()
    const items = await ServiceProduct.find({ serviceId }).lean()
    return items.map((p: any) => ({ id: p._id, serviceId: p.serviceId, productId: p.productId, quantity: p.quantity, isOptional: p.isOptional, createdAt: p.createdAt, updatedAt: p.updatedAt }))
  },

  async getAllServiceProducts(): Promise<Record<string, any[]>> {
    await connectToMongoDB()
    const items = await ServiceProduct.find({}).lean()
    const grouped: Record<string, any[]> = {}
    for (const p of items) {
      const sp = { id: p._id, serviceId: p.serviceId, productId: p.productId, quantity: p.quantity, isOptional: p.isOptional, createdAt: p.createdAt, updatedAt: p.updatedAt }
      grouped[p.serviceId] = grouped[p.serviceId] || []
      grouped[p.serviceId].push(sp)
    }
    return grouped
  },
}
