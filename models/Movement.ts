import type { Timestamp } from "firebase/firestore"

export type MovementType = "purchase" | "stock_in" | "stock_out"

export interface MovementItem {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface Movement {
  id: string
  type: MovementType
  date: Date | Timestamp
  supplierId?: string
  supplierName?: string
  items: MovementItem[]
  totalAmount: number
  currency: string
  notes: string
  attachments: string[]
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
  createdBy: string
}

export interface MovementFormData {
  type: MovementType
  date: Date
  supplierId?: string
  items: MovementItem[]
  currency: string
  notes: string
  attachments: string[]
}

export const movementTypeLabels: Record<MovementType, string> = {
  purchase: "Compra",
  stock_in: "Ingreso de Stock",
  stock_out: "Egreso de Stock",
}

export const getMovementTypeColor = (type: MovementType): string => {
  switch (type) {
    case "purchase":
      return "bg-blue-100 text-blue-800"
    case "stock_in":
      return "bg-green-100 text-green-800"
    case "stock_out":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
