import mongoose, { Schema, Document } from 'mongoose'

export interface ICategory extends Document {
  _id: string
  name: string
  description: string
  imageUrl: string
  icon?: string
  createdAt: Date
  updatedAt: Date
}

const CategorySchema = new Schema<ICategory>({
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
  imageUrl: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: false,
    default: null,
  }
}, {
  timestamps: true,
  collection: 'stockCategories'
})

// Índices para optimizar consultas
CategorySchema.index({ name: 'text', description: 'text' })
CategorySchema.index({ createdAt: -1 })

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema)

