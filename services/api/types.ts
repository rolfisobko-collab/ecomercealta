export interface Transaction {
  id: string
  closingId: string // ID del cierre al que pertenece (vacío si aún no se cerró)
  time: string // Hora ISO
  type: string
  amount: number
  currency: string
  description: string
  user: string // Usuario que realizó la transacción
  reference: string // Referencia externa (ej: ID de venta)
  createdAt: string // Fecha de creación ISO
  updatedAt: string // Fecha de actualización ISO
  receivable?: number // Monto por cobrar (para deudas)
  isDebt?: boolean // Indica si es una deuda
  exchangeRate?: number // Tasa de cambio usada (para monedas extranjeras)
}
