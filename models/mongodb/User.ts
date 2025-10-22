import mongoose, { Schema, Document } from 'mongoose'

export interface IUser extends Document {
  _id: string
  name: string
  email: string
  hashedPassword: string
  role: 'admin' | 'staff' | 'user'
  active: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  _id: { type: String },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  hashedPassword: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'user'],
    default: 'user'
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  collection: 'users'
})

// Índices para optimizar consultas
UserSchema.index({ email: 1 })
UserSchema.index({ role: 1 })
UserSchema.index({ active: 1 })

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema)

