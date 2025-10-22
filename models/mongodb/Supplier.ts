import mongoose, { Schema, Document } from 'mongoose'

export interface ISupplier extends Document {
  _id: string
  name: string
  contactName: string
  email: string
  phone: string
  address: string
  category: string
  notes: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const SupplierSchema = new Schema<ISupplier>({
  _id: { type: String },
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ["repuestos", "accesorios", "herramientas", "servicios", "otros"]
  },
  notes: {
    type: String,
    default: ""
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'suppliers'
})

// Índices para optimizar consultas
SupplierSchema.index({ name: 'text', contactName: 'text', email: 'text' })
SupplierSchema.index({ category: 1 })
SupplierSchema.index({ active: 1 })
SupplierSchema.index({ createdAt: -1 })

export const Supplier = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema)

