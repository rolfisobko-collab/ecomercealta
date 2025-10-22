// Tipos de monedas
export type Currency = "USD" | "USDT" | "PESO" | "PESO_TRANSFERENCIA" | "REAL" | "GUARANI"

// Tipo para el balance de caja
export interface CashBalance {
  [key: string]: number
}

// Tipo para una transacción
export interface Transaction {
  id: string
  type: "ingreso" | "egreso" | "venta" | "conversion"
  amount: number
  currency: Currency
  targetCurrency?: Currency
  targetAmount?: number
  description: string
  timestamp: Date
}

// Tipo para un ítem del carrito específico de la caja
export interface CashCartItem {
  id: string
  description: string
  price: number
  currency: Currency
  quantity: number
}
