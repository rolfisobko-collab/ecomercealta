import mongoose, { Schema, Document } from 'mongoose'

export interface IServiceProduct extends Document {
  _id: string
  serviceId: string
  productId: string
  quantity: number
  isOptional: boolean
  createdAt: Date
  updatedAt: Date
}

const ServiceProductSchema = new Schema<IServiceProduct>({
  serviceId: {
    type: String,
    required: true
  },
  productId: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  isOptional: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'serviceProducts'
})

export interface ITechnicalService extends Document {
  _id: string
  name: string
  description: string
  estimatedTime: number
  basePrice: number
  category: string
  brandId?: string
  modelId?: string
  isActive: boolean
  lastManualUpdate?: Date
  createdAt: Date
  updatedAt: Date
}

const TechnicalServiceSchema = new Schema<ITechnicalService>({
  _id: { type: String },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  estimatedTime: {
    type: Number,
    required: true,
    min: 0
  },
  basePrice: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true
  },
  brandId: {
    type: String
  },
  modelId: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastManualUpdate: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'technicalServices'
})

export interface IServiceBrand extends Document {
  _id: string
  name: string
  logoUrl?: string
  createdAt: Date
  updatedAt: Date
}

const ServiceBrandSchema = new Schema<IServiceBrand>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  logoUrl: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'serviceBrands'
})

export interface IServiceModel extends Document {
  _id: string
  name: string
  brandId: string
  createdAt: Date
  updatedAt: Date
}

const ServiceModelSchema = new Schema<IServiceModel>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brandId: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'serviceModels'
})

export interface IServiceSpecification extends Document {
  _id: string
  serviceId: string
  brandId: string
  modelId: string
  isActive: boolean
  specificPrice: number
  createdAt: Date
  updatedAt: Date
}

const ServiceSpecificationSchema = new Schema<IServiceSpecification>({
  serviceId: {
    type: String,
    required: true
  },
  brandId: {
    type: String,
    required: true
  },
  modelId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  specificPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'serviceSpecifications'
})

// Índices para optimizar consultas
TechnicalServiceSchema.index({ name: 'text', description: 'text' })
TechnicalServiceSchema.index({ category: 1 })
TechnicalServiceSchema.index({ brandId: 1 })
TechnicalServiceSchema.index({ modelId: 1 })
TechnicalServiceSchema.index({ isActive: 1 })

ServiceProductSchema.index({ serviceId: 1 })
ServiceProductSchema.index({ productId: 1 })

ServiceBrandSchema.index({ name: 'text' })

ServiceModelSchema.index({ name: 'text' })
ServiceModelSchema.index({ brandId: 1 })

ServiceSpecificationSchema.index({ serviceId: 1 })
ServiceSpecificationSchema.index({ brandId: 1, modelId: 1 })

export const TechnicalService = mongoose.models.TechnicalService || mongoose.model<ITechnicalService>('TechnicalService', TechnicalServiceSchema)
export const ServiceProduct = mongoose.models.ServiceProduct || mongoose.model<IServiceProduct>('ServiceProduct', ServiceProductSchema)
export const ServiceBrand = mongoose.models.ServiceBrand || mongoose.model<IServiceBrand>('ServiceBrand', ServiceBrandSchema)
export const ServiceModel = mongoose.models.ServiceModel || mongoose.model<IServiceModel>('ServiceModel', ServiceModelSchema)
export const ServiceSpecification = mongoose.models.ServiceSpecification || mongoose.model<IServiceSpecification>('ServiceSpecification', ServiceSpecificationSchema)

