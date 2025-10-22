"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Clock, DollarSign, FileText, User, Tag, ShoppingCart, Wrench } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Transaction } from "@/models/CashRegister"
import { formatCurrency } from "@/utils/formatCurrency"
import { doc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"

interface ExpenseListProps {
  expenses: Transaction[]
  selectedDate: Date
  isLoading: boolean
  onDeleteTransaction?: (transactionId: string) => void
}

const currencyLabels = {
  USD: "Dólares",
  USDT: "USDT",
  PESO: "Pesos",
  PESO_TRANSFERENCIA: "Transferencia",
  REAL: "Reales",
  GUARANI: "Guaraníes",
}

const typeLabels = {
  Ingreso: "Ingreso",
  Egreso: "Egreso",
  Venta: "Venta",
}

const typeColors = {
  Ingreso: "bg-green-100 text-green-800 border-green-200",
  Egreso: "bg-red-100 text-red-800 border-red-200",
  Venta: "bg-blue-100 text-blue-800 border-blue-200",
}

const categoryLabels = {
  venta_productos: "Venta de Productos",
  servicio_tecnico: "Servicio Técnico",
  almuerzo: "Almuerzo",
  transporte: "Transporte",
  sueldo: "Sueldo",
  comision: "Comisión",
  servicios: "Servicios",
  alquiler: "Alquiler",
  materiales: "Materiales/Insumos",
  marketing: "Marketing/Publicidad",
  mantenimiento: "Mantenimiento",
  otros: "Otros gastos",
}

export function ExpenseList({ expenses, selectedDate, isLoading, onDeleteTransaction }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (transactionId: string) => {
    if (!onDeleteTransaction) return

    const transaction = expenses.find((t) => t.id === transactionId)
    if (!transaction) {
      alert("No se encontró la transacción")
      return
    }

    const confirmed = confirm("¿Estás seguro de que quieres eliminar esta transacción?")
    if (!confirmed) return

    setDeletingId(transactionId)
    try {
      console.log("🗑️ INICIANDO ELIMINACIÓN")
      console.log("📄 ID de transacción:", transactionId)
      console.log("📄 Datos de transacción:", transaction)
      console.log("📄 Tiene referencia:", !!transaction.reference)

      let success = false

      // Si tiene referencia, es una venta de la colección "sales"
      if (transaction.reference) {
        console.log("🛒 Eliminando VENTA de colección 'sales'")
        console.log("🛒 Reference ID:", transaction.reference)

        try {
          await deleteDoc(doc(db, "sales", transaction.reference))
          console.log("✅ Venta eliminada de 'sales'")
          success = true
        } catch (error) {
          console.error("❌ Error eliminando de 'sales':", error)
          // Si falla, intentar eliminar como transacción manual
        }
      }

      // Si no tiene referencia O si falló eliminar la venta, intentar como transacción manual
      if (!transaction.reference || !success) {
        console.log("📄 Eliminando TRANSACCIÓN MANUAL de colección 'cashTransactions'")

        try {
          const response = await fetch(`/api/cash-transactions/${transactionId}`, {
            method: 'DELETE'
          })
          if (response.ok) {
            console.log("✅ Transacción manual eliminada de 'cashTransactions'")
            success = true
          }
        } catch (error) {
          console.error("❌ Error eliminando de 'cashTransactions':", error)
        }
      }

      if (success) {
        console.log("✅ ELIMINACIÓN EXITOSA")
        onDeleteTransaction(transactionId)
        alert("Transacción eliminada exitosamente")
      } else {
        throw new Error("No se pudo eliminar de ninguna colección")
      }
    } catch (error) {
      console.error("❌ ERROR GENERAL:", error)
      alert(`Error al eliminar: ${error instanceof Error ? error.message : "Error desconocido"}`)
    } finally {
      setDeletingId(null)
    }
  }

  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === "Venta") {
      if (transaction.category === "servicio_tecnico") {
        return <Wrench className="h-4 w-4 text-blue-600" />
      }
      return <ShoppingCart className="h-4 w-4 text-blue-600" />
    }
    return <DollarSign className="h-4 w-4 text-green-600" />
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historial de Transacciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-muted-foreground">Cargando transacciones...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Separar transacciones por tipo
  const salesTransactions = expenses.filter((t) => t.type === "Venta")
  const manualTransactions = expenses.filter((t) => t.type !== "Venta")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Historial de Transacciones - {format(selectedDate, "PPP", { locale: es })}
        </CardTitle>
        <div className="flex gap-2 text-sm text-muted-foreground">
          <span>{salesTransactions.length} ventas de caja</span>
          <span>•</span>
          <span>{manualTransactions.length} transacciones manuales</span>
          <span>•</span>
          <span className="font-medium">Total: {expenses.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        {expenses.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay transacciones para esta fecha</p>
          </div>
        ) : (
          <div className="space-y-4">
            {expenses.map((transaction) => (
              <div
                key={transaction.id}
                className={`flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                  transaction.reference ? "border-blue-200 bg-blue-50/30" : ""
                }`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction)}
                    <Badge className={typeColors[transaction.type as keyof typeof typeColors]}>
                      {typeLabels[transaction.type as keyof typeof typeLabels] || transaction.type}
                    </Badge>
                    <Badge variant="outline">
                      {currencyLabels[transaction.currency as keyof typeof currencyLabels] || transaction.currency}
                    </Badge>
                    {transaction.reference && (
                      <Badge variant="secondary" className="text-xs">
                        🏪 Caja
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {format(new Date(transaction.time), "HH:mm:ss", { locale: es })}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold text-lg ${
                        transaction.type === "Egreso" ? "text-red-600" : "text-green-600"
                      }`}
                    >
                      {transaction.type === "Egreso" ? "-" : "+"}
                      {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                    </span>
                  </div>

                  {transaction.description && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <span>{transaction.description}</span>
                    </div>
                  )}

                  {transaction.category && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span>
                        {categoryLabels[transaction.category as keyof typeof categoryLabels] || transaction.category}
                      </span>
                    </div>
                  )}

                  {transaction.user && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{transaction.user}</span>
                    </div>
                  )}

                  {transaction.reference && (
                    <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded inline-block">
                      Ref: {transaction.reference}
                    </div>
                  )}

                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded inline-block">
                    ID: {transaction.id}
                  </div>
                </div>

                {onDeleteTransaction && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(transaction.id)}
                    disabled={deletingId === transaction.id}
                    className="ml-4 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deletingId === transaction.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
