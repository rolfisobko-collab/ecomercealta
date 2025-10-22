import type { Product } from "./Product"

export interface Favorite {
  id: string
  userId: string
  productId: string
  createdAt: Date
  product?: Product
}
