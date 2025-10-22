export interface TechnicalService {
  id: string
  name: string
  description: string
  estimatedTime: number // en minutos
  basePrice: number
  category: string
  brandId?: string
  modelId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastManualUpdate?: Date
}

export interface ServiceProduct {
  id: string
  serviceId: string
  productId: string
  quantity: number
  isOptional: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceProductData {
  serviceId: string
  productId: string
  quantity: number
  isOptional: boolean
}

export interface UpdateServiceProductData {
  quantity?: number
  isOptional?: boolean
}

export interface CreateTechnicalServiceData {
  name: string
  description: string
  estimatedTime: number
  basePrice: number
  category: string
  brandId?: string
  modelId?: string
  isActive?: boolean
}

export interface UpdateTechnicalServiceData {
  name?: string
  description?: string
  estimatedTime?: number
  basePrice?: number
  category?: string
  brandId?: string
  modelId?: string
  isActive?: boolean
  lastManualUpdate?: Date
}

export interface ServiceBrand {
  id: string
  name: string
  logoUrl?: string
  createdAt: Date
  updatedAt: Date
}

export interface ServiceModel {
  id: string
  name: string
  brandId: string
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceBrandData {
  name: string
  logoUrl?: string
}

export interface CreateServiceModelData {
  name: string
  brandId: string
}

export interface ServiceSpecification {
  id: string
  serviceId: string
  brandId: string
  modelId: string
  isActive: boolean
  specificPrice: number
  createdAt: Date
  updatedAt: Date
}

export interface CreateServiceSpecificationData {
  serviceId: string
  brandId: string
  modelId: string
  isActive: boolean
  specificPrice: number
}

export interface UpdateServiceSpecificationData {
  isActive?: boolean
  specificPrice?: number
}

export interface TechnicalServiceWithProducts extends TechnicalService {
  products?: ServiceProduct[]
}
