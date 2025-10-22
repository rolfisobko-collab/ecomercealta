import mongoose, { Schema, Document } from 'mongoose'

export interface IFavorite extends Document {
  _id: string
  userId: string
  productId: string
  createdAt: Date
}

const FavoriteSchema = new Schema<IFavorite>({
  _id: { type: String },
  userId: {
    type: String,
    required: true
  },
  productId: {
    type: String,
    required: true
  }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'favorites'
})

// Índices para optimizar consultas
FavoriteSchema.index({ userId: 1, productId: 1 }, { unique: true })
FavoriteSchema.index({ userId: 1 })
FavoriteSchema.index({ productId: 1 })

export const Favorite = mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema)

