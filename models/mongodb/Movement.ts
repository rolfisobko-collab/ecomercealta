import mongoose, { Schema, Document } from 'mongoose'

export type MovementType = "purchase" | "stock_in" | "stock_out"

export interface IMovementItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

const MovementItemSchema = new Schema<IMovementItem>({
  productId: {
    type: String,
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false })

export interface IMovement extends Document {
  _id: string
  type: MovementType
  date: Date
  supplierId?: string
  supplierName?: string
  items: IMovementItem[]
  totalAmount: number
  currency: string
  notes: string
  attachments: string[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

const MovementSchema = new Schema<IMovement>({
  _id: { type: String },
  type: {
    type: String,
    enum: ["purchase", "stock_in", "stock_out"],
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  supplierId: {
    type: String
  },
  supplierName: {
    type: String
  },
  items: [MovementItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  notes: {
    type: String,
    default: ""
  },
  attachments: [{
    type: String
  }],
  createdBy: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
  collection: 'movements'
})

// Índices para optimizar consultas
MovementSchema.index({ type: 1 })
MovementSchema.index({ date: -1 })
MovementSchema.index({ supplierId: 1 })
MovementSchema.index({ createdBy: 1 })

export const Movement = mongoose.models.Movement || mongoose.model<IMovement>('Movement', MovementSchema)

