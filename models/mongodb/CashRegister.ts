import mongoose, { Schema, Document } from 'mongoose'

export type Currency = "USD" | "USDT" | "PESO" | "PESO_TRANSFERENCIA" | "REAL" | "GUARANI"
export type TransactionType = "Ingreso" | "Egreso" | "Venta" | "Compra" | "Ajuste"

export interface IBalanceItem {
  income: number
  expense: number
  receivable: number
  payable: number
  balance: number
}

export interface ICashBalance {
  USD: IBalanceItem
  USDT: IBalanceItem
  PESO: IBalanceItem
  PESO_TRANSFERENCIA: IBalanceItem
  REAL: IBalanceItem
  GUARANI: IBalanceItem
  date: string
}

const BalanceItemSchema = new Schema<IBalanceItem>({
  income: { type: Number, default: 0 },
  expense: { type: Number, default: 0 },
  receivable: { type: Number, default: 0 },
  payable: { type: Number, default: 0 },
  balance: { type: Number, default: 0 }
}, { _id: false })

const CashBalanceSchema = new Schema<ICashBalance>({
  USD: { type: BalanceItemSchema, default: () => ({ income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 }) },
  USDT: { type: BalanceItemSchema, default: () => ({ income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 }) },
  PESO: { type: BalanceItemSchema, default: () => ({ income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 }) },
  PESO_TRANSFERENCIA: { type: BalanceItemSchema, default: () => ({ income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 }) },
  REAL: { type: BalanceItemSchema, default: () => ({ income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 }) },
  GUARANI: { type: BalanceItemSchema, default: () => ({ income: 0, expense: 0, receivable: 0, payable: 0, balance: 0 }) },
  date: { type: String, required: true }
}, { _id: false })

export interface ITransaction extends Document {
  _id: string
  closingId: string
  time: string
  type: TransactionType
  amount: number
  currency: Currency
  description: string
  user: string
  reference: string
  category?: string
  receivable?: number
  isDebt?: boolean
  exchangeRate?: number
  createdAt: Date
  updatedAt: Date
}

const TransactionSchema = new Schema<ITransaction>({
  _id: { type: String },
  closingId: {
    type: String,
    default: ""
  },
  time: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["Ingreso", "Egreso", "Venta", "Compra", "Ajuste"],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    enum: ["USD", "USDT", "PESO", "PESO_TRANSFERENCIA", "REAL", "GUARANI"],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  reference: {
    type: String,
    required: true
  },
  category: {
    type: String
  },
  receivable: {
    type: Number,
    default: 0
  },
  isDebt: {
    type: Boolean,
    default: false
  },
  exchangeRate: {
    type: Number
  }
}, {
  timestamps: true,
  collection: 'transactions'
})

export interface ICashClosing extends Document {
  _id: string
  date: string
  user: string
  status: "Correcto" | "Faltante" | "Sobrante"
  difference: number
  notes: string
  balance: ICashBalance
  createdAt: Date
  updatedAt: Date
}

const CashClosingSchema = new Schema<ICashClosing>({
  _id: { type: String },
  date: {
    type: String,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["Correcto", "Faltante", "Sobrante"],
    required: true
  },
  difference: {
    type: Number,
    required: true
  },
  notes: {
    type: String,
    default: ""
  },
  balance: {
    type: CashBalanceSchema,
    required: true
  }
}, {
  timestamps: true,
  collection: 'cashClosings'
})

// Índices para optimizar consultas
TransactionSchema.index({ closingId: 1 })
TransactionSchema.index({ type: 1 })
TransactionSchema.index({ currency: 1 })
TransactionSchema.index({ user: 1 })
TransactionSchema.index({ time: -1 })

CashClosingSchema.index({ date: -1 })
CashClosingSchema.index({ user: 1 })
CashClosingSchema.index({ status: 1 })

export const Transaction = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', TransactionSchema)
export const CashClosing = mongoose.models.CashClosing || mongoose.model<ICashClosing>('CashClosing', CashClosingSchema)

