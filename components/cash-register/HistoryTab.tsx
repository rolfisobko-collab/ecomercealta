"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { Transaction } from "@/models/CashRegister"
import { useState, useEffect } from "react"

interface HistoryTabProps {
  transactions?: Transaction[]
}

export function HistoryTab({ transactions = [] }: HistoryTabProps) {
  const [page, setPage] = useState(1)
  const pageSize = 10
  const [totalPages, setTotalPages] = useState(Math.ceil(transactions.length / pageSize))

  // Función para formatear la fecha/hora
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString)
    return new Intl.DateTimeFormat("es-AR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Función para obtener la variante del badge según el tipo de transacción
  const getBadgeVariant = (type: string) => {
    switch (type) {
      case "Venta":
        return "success"
      case "Ingreso":
        return "success"
      case "Egreso":
        return "destructive"
      case "Compra":
        return "destructive"
      case "Conversión":
        return "default"
      case "Ajuste":
        return "outline"
      default:
        return "default"
    }
  }

  // Función para formatear el monto con el símbolo de la moneda
  const formatAmount = (amount: number, currency: string) => {
    let symbol = ""
    switch (currency) {
      case "PESO":
      case "PESO_TRANSFERENCIA":
        symbol = "$"
        break
      case "USD":
      case "USDT":
        symbol = "$"
        break
      case "GUARANI":
        symbol = "₲"
        break
      case "REAL":
        symbol = "R$"
        break
      default:
        symbol = "$"
    }

    return `${symbol}${amount.toLocaleString()}`
  }

  // Antes de la paginación, filtrar solo las transacciones de la caja actual y ordenarlas por fecha
  const currentCashTransactions = transactions.filter((t) => t.closingId === "")
  const sortedTransactions = [...currentCashTransactions].sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime()
  })

  // Paginación (aplicada después del ordenamiento)
  const paginatedTransactions = sortedTransactions.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    setTotalPages(Math.ceil(sortedTransactions.length / pageSize))
  }, [sortedTransactions.length, pageSize])

  // Actualizar el balance global cuando cambian las transacciones
  useEffect(() => {
    if (window.reloadCashRegisterData && typeof window.reloadCashRegisterData === "function") {
      window.reloadCashRegisterData()
    }
  }, [transactions])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Transacciones</CardTitle>
        <CardDescription>Todas las transacciones registradas</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha/Hora</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Moneda</TableHead>
              <TableHead>Descripción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No hay transacciones para mostrar
                </TableCell>
              </TableRow>
            ) : (
              <>
                {paginatedTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDateTime(transaction.time)}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(transaction.type)}>{transaction.type}</Badge>
                    </TableCell>
                    <TableCell>{formatAmount(transaction.amount, transaction.currency)}</TableCell>
                    <TableCell>{transaction.currency.replace("_", " ")}</TableCell>
                    <TableCell>{transaction.description}</TableCell>
                  </TableRow>
                ))}

                {/* No hay sección de totales aquí - se muestra en la pestaña Balance */}
              </>
            )}
          </TableBody>
        </Table>
      </CardContent>
      {totalPages > 1 && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Anterior
          </Button>
          <div className="text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </div>
          <Button
            variant="outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Siguiente
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

declare global {
  interface Window {
    reloadCashRegisterData?: () => Promise<void>
  }
}
