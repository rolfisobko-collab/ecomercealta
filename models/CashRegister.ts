// Tipos para el sistema de caja

// Monedas soportadas
export type Currency = "USD" | "USDT" | "PESO" | "PESO_TRANSFERENCIA" | "REAL" | "GUARANI"

// Tipos de transacciones
export type TransactionType = "Ingreso" | "Egreso" | "Venta" | "Compra" | "Ajuste"

// Estructura para un ítem de balance
export interface BalanceItem {
  income: number // Ingresos
  expense: number // Egresos
  receivable: number // Por cobrar
  payable: number // Por pagar
  balance: number // Balance (income - expense)
}

// Balance de caja completo
export interface CashBalance {
  USD: BalanceItem
  USDT: BalanceItem
  PESO: BalanceItem
  PESO_TRANSFERENCIA: BalanceItem
  REAL: BalanceItem
  GUARANI: BalanceItem
  date: string // Fecha ISO
}

// Interfaz para transacciones
export interface Transaction {
  id: string
  closingId: string // ID del cierre al que pertenece (vacío si aún no se cerró)
  time: string // Hora ISO
  type: TransactionType
  amount: number
  currency: Currency
  description: string
  user: string // Usuario que realizó la transacción
  reference: string // Referencia externa (ej: ID de venta)
  category?: string // NUEVO: Para categorizar egresos
  createdAt: string // Fecha de creación ISO
  updatedAt: string // Fecha de actualización ISO
  receivable?: number // Monto por cobrar (para deudas)
  isDebt?: boolean // Indica si es una deuda
  exchangeRate?: number // Tasa de cambio usada (para monedas extranjeras)

  // Método para convertir a formato Firestore
  toFirestore(): Record<string, any>
}

// Implementación de transacción
export class CashTransaction implements Transaction {
  id: string
  closingId: string
  time: string
  type: TransactionType
  amount: number
  currency: Currency
  description: string
  user: string
  reference: string
  category?: string
  createdAt: string
  updatedAt: string
  receivable?: number
  isDebt?: boolean
  exchangeRate?: number

  constructor(data: Partial<Transaction>) {
    this.id = data.id || ""
    this.closingId = data.closingId || ""
    this.time = data.time || new Date().toISOString()
    this.type = data.type || "Ingreso"
    this.amount = data.amount || 0
    this.currency = data.currency || "PESO"
    this.description = data.description || ""
    this.user = data.user || ""
    this.reference = data.reference || ""
    this.category = data.category
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
    this.receivable = data.receivable || 0
    this.isDebt = data.isDebt || false
    this.exchangeRate = data.exchangeRate
  }

  toFirestore(): Record<string, any> {
    return {
      closingId: this.closingId,
      time: this.time,
      type: this.type,
      amount: this.amount,
      currency: this.currency,
      description: this.description,
      user: this.user,
      reference: this.reference,
      category: this.category,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      receivable: this.receivable || 0,
      isDebt: this.isDebt || false,
      exchangeRate: this.exchangeRate,
    }
  }
}

// Interfaz para cierres de caja
export interface CashClosing {
  id: string
  date: string // Fecha ISO
  user: string // Usuario que realizó el cierre
  status: "Correcto" | "Faltante" | "Sobrante"
  difference: number // Diferencia entre balance real y proyectado
  notes: string // Notas adicionales
  balance: CashBalance // Balance al momento del cierre
  createdAt: string // Fecha de creación ISO
  updatedAt: string // Fecha de actualización ISO

  // Método para convertir a formato Firestore
  toFirestore(): Record<string, any>
}

// Implementación de cierre de caja
export class CashRegisterClosing implements CashClosing {
  id: string
  date: string
  user: string
  status: "Correcto" | "Faltante" | "Sobrante"
  difference: number
  notes: string
  balance: CashBalance
  createdAt: string
  updatedAt: string

  constructor(data: Partial<CashClosing>) {
    this.id = data.id || ""
    this.date = data.date || new Date().toISOString()
    this.user = data.user || ""
    this.status = data.status || "Correcto"
    this.difference = data.difference || 0
    this.notes = data.notes || ""
    this.balance = data.balance || {
      USD: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
      USDT: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
      PESO: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
      PESO_TRANSFERENCIA: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
      REAL: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
      GUARANI: { income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 },
      date: new Date().toISOString(),
    }
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  toFirestore(): Record<string, any> {
    return {
      date: this.date,
      user: this.user,
      status: this.status,
      difference: this.difference,
      notes: this.notes,
      balance: this.balance,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }
}
