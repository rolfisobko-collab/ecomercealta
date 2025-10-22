"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, doc, updateDoc, Timestamp, orderBy } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, Search, FileText, RefreshCw } from "lucide-react"
import { cashRegisterService } from "@/services/api/cashRegisterService"
import type { Transaction } from "@/models/CashRegister"
import type { Currency } from "@/models/Currency"

export default function DeudasPage() {
  const [deudas, setDeudas] = useState<Transaction[]>([])
  const [filteredDeudas, setFilteredDeudas] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCurrency, setFilterCurrency] = useState<string>("todas")
  const [selectedDeuda, setSelectedDeuda] = useState<Transaction | null>(null)
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<Currency>("PESO")
  // Añadir un nuevo estado para los totales por divisa
  const [deudaTotales, setDeudaTotales] = useState<Record<string, number>>({})
  const [showFiltersMobile, setShowFiltersMobile] = useState(false)

  // Modificar la función loadDeudas para calcular los totales
  const loadDeudas = async () => {
    try {
      setIsLoading(true)
      
      // Usar API route de MongoDB
      const response = await fetch('/api/cash-transactions?type=debts')
      if (!response.ok) throw new Error('Failed to fetch debts')
      
      const transactions = await response.json()
      const deudasData: Transaction[] = []
      const totalesPorDivisa: Record<string, number> = {}

      transactions.forEach((data: any) => {
        const currency = data.currency || "PESO"
        const receivable = data.receivable || 0

        // Acumular totales por divisa
        if (!totalesPorDivisa[currency]) {
          totalesPorDivisa[currency] = 0
        }
        totalesPorDivisa[currency] += receivable

        deudasData.push({
          id: doc.id,
          closingId: data.closingId || "",
          time: data.time instanceof Timestamp ? data.time.toDate().toISOString() : data.time,
          type: data.type || "Venta",
          amount: data.amount || 0,
          currency: currency,
          description: data.description || "",
          user: data.user || "",
          reference: data.reference || "",
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
          receivable: receivable,
          isDebt: data.isDebt || false,
          exchangeRate: data.exchangeRate,
        })
      })

      setDeudas(deudasData)
      setFilteredDeudas(deudasData)
      setDeudaTotales(totalesPorDivisa)
    } catch (error) {
      console.error("Error al cargar deudas:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filtrar deudas según los criterios
  useEffect(() => {
    let filtered = [...deudas]

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (deuda) => deuda.description.toLowerCase().includes(term) || deuda.reference.toLowerCase().includes(term),
      )
    }

    // Filtrar por moneda
    if (filterCurrency !== "todas") {
      filtered = filtered.filter((deuda) => deuda.currency === filterCurrency)
    }

    setFilteredDeudas(filtered)
  }, [searchTerm, filterCurrency, deudas])

  // Cargar deudas al montar el componente
  useEffect(() => {
    loadDeudas()
  }, [])

  // Formatear moneda
  const formatCurrency = (amount: number, currency: string) => {
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
    }

    return `${symbol}${amount.toLocaleString()}`
  }

  // Formatear fecha
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date)
  }

  // Procesar pago de deuda
  const processPayment = async () => {
    if (!selectedDeuda || !paymentAmount) return

    try {
      setIsProcessingPayment(true)

      const paymentAmountNum = Number.parseFloat(paymentAmount)
      if (isNaN(paymentAmountNum) || paymentAmountNum <= 0) {
        alert("Por favor ingrese un monto válido")
        return
      }

      if (paymentAmountNum > selectedDeuda.receivable) {
        alert("El monto de pago no puede ser mayor que la deuda pendiente")
        return
      }

      // Actualizar la transacción de deuda usando API route
      const newReceivable = selectedDeuda.receivable - paymentAmountNum

      await fetch(`/api/cash-transactions/${selectedDeuda.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receivable: newReceivable,
          updatedAt: new Date().toISOString(),
        })
      })

      // Registrar el pago como una nueva transacción
      await cashRegisterService.addTransaction({
        type: "Ingreso",
        amount: paymentAmountNum,
        currency: paymentMethod,
        description: `Pago de deuda: ${selectedDeuda.description}`,
        user: "Admin", // Idealmente debería venir del contexto de autenticación
        time: new Date().toISOString(),
        reference: `Pago de deuda ID: ${selectedDeuda.id}`,
        closingId: "",
        isDebt: false,
      })

      // Si la deuda se pagó completamente, actualizar isDebt
      if (newReceivable === 0) {
        await fetch(`/api/cash-transactions/${selectedDeuda.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            isDebt: false,
          })
        })
      }

      // Recargar deudas
      await loadDeudas()

      // Cerrar diálogo y limpiar estado
      setIsPaymentDialogOpen(false)
      setSelectedDeuda(null)
      setPaymentAmount("")

      alert("Pago procesado correctamente")
    } catch (error) {
      console.error("Error al procesar pago:", error)
      alert("Error al procesar el pago. Intente nuevamente.")
    } finally {
      setIsProcessingPayment(false)
    }
  }

  // Añadir un nuevo componente para mostrar los totales por divisa después del título y antes del Card principal
  // Reemplazar la sección del título con esto:
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Deudas</h1>
        <Button onClick={loadDeudas} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" /> Actualizar
        </Button>
      </div>

      {/* Tarjetas de resumen por divisa */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(deudaTotales).map(([currency, total]) => (
          <Card
            key={currency}
            className={`${
              currency === "PESO" || currency === "PESO_TRANSFERENCIA"
                ? "border-amber-200 bg-amber-50"
                : currency === "USD" || currency === "USDT"
                  ? "border-green-200 bg-green-50"
                  : currency === "GUARANI"
                    ? "border-blue-200 bg-blue-50"
                    : currency === "REAL"
                      ? "border-emerald-200 bg-emerald-50"
                      : ""
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Pendiente</p>
                  <h3 className="text-2xl font-bold mt-1">{formatCurrency(total, currency)}</h3>
                </div>
                <div className="rounded-full p-2 bg-white">
                  {currency === "PESO" && "💵"}
                  {currency === "PESO_TRANSFERENCIA" && "🏦"}
                  {currency === "USD" && "💰"}
                  {currency === "USDT" && "🪙"}
                  {currency === "GUARANI" && "🇵🇾"}
                  {currency === "REAL" && "🇧🇷"}
                </div>
              </div>
              <p className="text-xs font-medium mt-2">
                {currency === "PESO" && "PESO ARS"}
                {currency === "PESO_TRANSFERENCIA" && "PESO TRANSFERENCIA"}
                {currency === "USD" && "DÓLAR USD"}
                {currency === "USDT" && "USDT"}
                {currency === "GUARANI" && "GUARANÍ"}
                {currency === "REAL" && "REAL"}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deudas Pendientes</CardTitle>
          <CardDescription>Visualice y gestione todas las deudas pendientes de cobro</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile filters toggle */}
          <div className="md:hidden mb-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Filtros</span>
            <Button size="sm" variant="outline" onClick={() => setShowFiltersMobile(v => !v)}>
              {showFiltersMobile ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
          <div className={`flex flex-col md:flex-row gap-4 mb-6 ${showFiltersMobile ? '' : 'hidden'} md:flex`}>
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por descripción o referencia..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterCurrency} onValueChange={setFilterCurrency}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filtrar por moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las monedas</SelectItem>
                <SelectItem value="PESO">PESO ARS</SelectItem>
                <SelectItem value="PESO_TRANSFERENCIA">PESO TRANSFERENCIA</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
                <SelectItem value="USDT">USDT</SelectItem>
                <SelectItem value="GUARANI">GUARANÍ</SelectItem>
                <SelectItem value="REAL">REAL</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : filteredDeudas.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No hay deudas</AlertTitle>
              <AlertDescription>No se encontraron deudas pendientes con los filtros actuales.</AlertDescription>
            </Alert>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="hidden sm:table-cell">Referencia</TableHead>
                    <TableHead className="hidden md:table-cell">Moneda</TableHead>
                    <TableHead className="hidden sm:table-cell">Monto Total</TableHead>
                    <TableHead>Pendiente</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeudas.map((deuda) => (
                    <TableRow key={deuda.id}>
                      <TableCell className="font-medium">{formatDate(deuda.time)}</TableCell>
                      <TableCell>{deuda.description}</TableCell>
                      <TableCell className="hidden sm:table-cell">{deuda.reference}</TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">
                          {deuda.currency === "PESO" && "💵 PESO"}
                          {deuda.currency === "PESO_TRANSFERENCIA" && "🏦 PESO TRANSF."}
                          {deuda.currency === "USD" && "💰 USD"}
                          {deuda.currency === "USDT" && "🪙 USDT"}
                          {deuda.currency === "GUARANI" && "🇵🇾 GUARANÍ"}
                          {deuda.currency === "REAL" && "🇧🇷 REAL"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatCurrency(deuda.amount, deuda.currency)}</TableCell>
                      <TableCell className="text-amber-600 font-medium">
                        {formatCurrency(deuda.receivable, deuda.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog
                          open={isPaymentDialogOpen && selectedDeuda?.id === deuda.id}
                          onOpenChange={(open) => {
                            setIsPaymentDialogOpen(open)
                            if (!open) setSelectedDeuda(null)
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDeuda(deuda)
                                setPaymentAmount(deuda.receivable.toString())
                                setIsPaymentDialogOpen(true)
                              }}
                            >
                              Registrar Pago
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Registrar Pago de Deuda</DialogTitle>
                              <DialogDescription>
                                Complete los detalles del pago para la deuda seleccionada.
                              </DialogDescription>
                            </DialogHeader>

                            {selectedDeuda && (
                              <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium mb-1">Descripción:</p>
                                    <p className="text-sm">{selectedDeuda.description}</p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-1">Referencia:</p>
                                    <p className="text-sm">{selectedDeuda.reference}</p>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium mb-1">Monto Total:</p>
                                    <p className="text-sm">
                                      {formatCurrency(selectedDeuda.amount, selectedDeuda.currency)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium mb-1">Pendiente:</p>
                                    <p className="text-sm text-amber-600 font-medium">
                                      {formatCurrency(selectedDeuda.receivable, selectedDeuda.currency)}
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Monto a Pagar:</label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={selectedDeuda.receivable}
                                    value={paymentAmount}
                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <label className="text-sm font-medium">Método de Pago:</label>
                                  <Select
                                    value={paymentMethod}
                                    onValueChange={(value) => setPaymentMethod(value as Currency)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Seleccione método de pago" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="PESO">💵 PESO ARS</SelectItem>
                                      <SelectItem value="PESO_TRANSFERENCIA">🏦 PESO TRANSFERENCIA</SelectItem>
                                      <SelectItem value="USD">💰 USD</SelectItem>
                                      <SelectItem value="USDT">🪙 USDT</SelectItem>
                                      <SelectItem value="GUARANI">🇵🇾 GUARANÍ</SelectItem>
                                      <SelectItem value="REAL">🇧🇷 REAL</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            )}

                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setIsPaymentDialogOpen(false)
                                  setSelectedDeuda(null)
                                }}
                              >
                                Cancelar
                              </Button>
                              <Button onClick={processPayment} disabled={isProcessingPayment || !paymentAmount}>
                                {isProcessingPayment ? (
                                  <>
                                    <div className="animate-spin mr-2 h-4 w-4 border-b-2 border-white rounded-full"></div>
                                    Procesando...
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" /> Confirmar Pago
                                  </>
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">Total: {filteredDeudas.length} deudas pendientes</div>
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" /> Exportar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
