import mongoose, { Schema, Document } from 'mongoose'

export interface IProduct extends Document {
  _id: string
  name: string
  description: string
  markdownDescription?: string
  price: number
  cost?: number
  currency: string
  quantity: number
  category: string
  location?: string
  obs?: string
  images: string[]
  image1?: string
  image2?: string
  image3?: string
  image4?: string
  image5?: string
  youtubeVideoId?: string
  youtubeUrl?: string
  isInStock: boolean
  brand?: string
  model?: string
  discount?: number
  lastManualUpdate?: Date
  createdAt: Date
  updatedAt: Date
}

const ProductSchema = new Schema<IProduct>({
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
  markdownDescription: {
    type: String
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true
  },
  location: {
    type: String
  },
  obs: {
    type: String
  },
  images: [{
    type: String
  }],
  image1: {
    type: String
  },
  image2: {
    type: String
  },
  image3: {
    type: String
  },
  image4: {
    type: String
  },
  image5: {
    type: String
  },
  youtubeVideoId: {
    type: String
  },
  youtubeUrl: {
    type: String
  },
  isInStock: {
    type: Boolean,
    default: function() {
      return this.quantity > 0
    }
  },
  brand: {
    type: String
  },
  model: {
    type: String
  },
  discount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastManualUpdate: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'stock'
})

// Middleware para actualizar isInStock automáticamente
ProductSchema.pre('save', function(next) {
  this.isInStock = this.quantity > 0
  next()
})

// Índices para optimizar consultas
ProductSchema.index({ name: 'text', description: 'text', brand: 'text', model: 'text' })
ProductSchema.index({ category: 1 })
ProductSchema.index({ isInStock: 1 })
ProductSchema.index({ price: 1 })
ProductSchema.index({ quantity: 1 })
ProductSchema.index({ createdAt: -1 })

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema)

