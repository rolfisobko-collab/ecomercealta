"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Receipt, CheckCircle, DollarSign, Clock, Eye, Wrench, Trash2, Printer } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  collection,
  query,
  orderBy,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  getDoc,
  addDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { createPortal } from "react-dom"
import { useCurrency } from "@/context/CurrencyContext"

interface Sale {
  id: string
  saleNumber: string
  date: string
  time: string
  items: Array<{
    name: string
    quantity: number
    price: number
    subtotal: number
  }>
  subtotal: number
  total: number
  currency: string
  paymentMethod: string
  status: "pending" | "paid" | "delivered"
  createdAt: any
  paidAt?: any
  paymentDetails?: {
    method: string
    amounts: {
      cashUSD?: number
      cashARS?: number
      transferARS?: number
      usdt?: number
      real?: number
      guarani?: number
    }
    exchangeRates?: {
      usdToArs?: number
      usdToReal?: number
      usdToGuarani?: number
    }
  }
  isService?: boolean
  serviceData?: any
  // Nuevos campos para compatibilidad
  displayCurrency?: string
  exchangeRate?: number
  displayTotal?: number
}

interface PaymentModalProps {
  sale: Sale
  onClose: () => void
  onConfirm: (paymentDetails: any) => void
}

interface SaleDetailsModalProps {
  sale: Sale
  onClose: () => void
}

const SaleDetailsModal = ({ sale, onClose }: SaleDetailsModalProps) => {
  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") return `$${amount.toFixed(2)} USD`
    if (currency === "PESO" || currency === "ARS") return `$${amount.toLocaleString()} ARS`
    return `$${amount.toLocaleString()} ARS`
  }

  // Print a receipt for a given sale
  const printSale = (sale: Sale) => {
    const now = new Date()
    const receiptDate = sale.date || now.toLocaleDateString("es-AR")
    const receiptTime = sale.time || now.toLocaleTimeString("es-AR")
    const currencySymbol = sale.currency === "ARS" || sale.currency === "PESO" ? "ARS $" : "USD $"

    const formatPrice = (price: number) => {
      // Si el sale.displayCurrency es ARS y displayTotal existe, respetar totales mostrados
      if (sale.currency === "ARS" || sale.currency === "PESO") return Number(price).toFixed(0)
      return Number(price).toFixed(2)
    }

    let receipt = `\n================================\n      COMPROBANTE DE VENTA\n================================\nFecha: ${receiptDate}\nHora: ${receiptTime}\n--------------------------------\nPRODUCTOS:\n--------------------------------\n`
    sale.items.forEach((item) => {
      const itemName = String(item.name || "").slice(0, 20)
      const itemPrice = formatPrice(item.price)
      const itemTotal = formatPrice(item.subtotal)
      receipt += `${itemName}\n`
      receipt += `${item.quantity} x ${currencySymbol}${itemPrice} = ${currencySymbol}${itemTotal}\n`
      receipt += `--------------------------------\n`
    })

    receipt += `\nSUBTOTAL:           ${currencySymbol}${formatPrice(sale.subtotal)}\n--------------------------------\nTOTAL:              ${currencySymbol}${formatPrice(sale.total)}\n--------------------------------\nEstado: ${sale.status === 'paid' ? 'Pagado' : sale.status}\n================================\n`

    const printWindow = window.open("", "_blank", "width=300,height=600")
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Comprobante de Venta</title>
            <style>
              @media print {
                @page { size: 73mm auto; margin: 0; }
                body { font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.2; margin: 0; padding: 2mm; width: 69mm; }
              }
              body { font-family: 'Courier New', monospace; font-size: 10px; line-height: 1.2; margin: 0; padding: 5px; white-space: pre-wrap; }
            </style>
          </head>
          <body>${receipt.replace(/\n/g, '<br>')}</body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => { printWindow.print(); printWindow.close() }, 400)
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999999,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999999 }}>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-blue-600" />
              Detalles de Venta - {sale.saleNumber}
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {/* Sale Info */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Fecha:</label>
                <p className="font-semibold">{sale.date}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Hora:</label>
                <p className="font-semibold">{sale.time}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Estado:</label>
                <div className="mt-1">
                  <Badge variant={sale.status === "paid" ? "default" : "destructive"}>
                    {sale.status === "paid" ? "Pagado" : "Pendiente"}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Total:</label>
                <p className="font-bold text-xl">{formatCurrency(sale.total, sale.currency)}</p>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {sale.paymentDetails && (
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">Detalles del Pago</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {sale.paymentDetails.amounts.cashUSD && sale.paymentDetails.amounts.cashUSD > 0 && (
                  <div>
                    <span className="text-green-700">Efectivo USD:</span>
                    <p className="font-medium">${sale.paymentDetails.amounts.cashUSD.toFixed(2)}</p>
                  </div>
                )}
                {sale.paymentDetails.amounts.usdt && sale.paymentDetails.amounts.usdt > 0 && (
                  <div>
                    <span className="text-green-700">USDT:</span>
                    <p className="font-medium">${sale.paymentDetails.amounts.usdt.toFixed(2)}</p>
                  </div>
                )}
                {sale.paymentDetails.amounts.cashARS && sale.paymentDetails.amounts.cashARS > 0 && (
                  <div>
                    <span className="text-green-700">Efectivo ARS:</span>
                    <p className="font-medium">${sale.paymentDetails.amounts.cashARS.toLocaleString()}</p>
                  </div>
                )}
                {sale.paymentDetails.amounts.transferARS && sale.paymentDetails.amounts.transferARS > 0 && (
                  <div>
                    <span className="text-green-700">Transferencia ARS:</span>
                    <p className="font-medium">${sale.paymentDetails.amounts.transferARS.toLocaleString()}</p>
                  </div>
                )}
                {sale.paymentDetails.amounts.real && sale.paymentDetails.amounts.real > 0 && (
                  <div>
                    <span className="text-green-700">Real:</span>
                    <p className="font-medium">R${sale.paymentDetails.amounts.real.toFixed(2)}</p>
                  </div>
                )}
                {sale.paymentDetails.amounts.guarani && sale.paymentDetails.amounts.guarani > 0 && (
                  <div>
                    <span className="text-green-700">Guaraní:</span>
                    <p className="font-medium">₲{sale.paymentDetails.amounts.guarani.toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Products */}
          <div>
            <h3 className="font-semibold mb-3">Productos:</h3>
            <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-gray-700/50">
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Precio Unit.</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{formatCurrency(item.price, sale.currency)}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(item.subtotal, sale.currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span>{formatCurrency(sale.total, sale.currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Usar createPortal para renderizar fuera del contexto actual
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}

const PaymentModal = ({ sale, onClose, onConfirm }: PaymentModalProps) => {
  const { currency } = useCurrency()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [paymentAmounts, setPaymentAmounts] = useState({
    cashUSD: 0,
    cashARS: 0,
    transferARS: 0,
    usdt: 0,
    real: 0,
    guarani: 0,
  })

  const [exchangeRates, setExchangeRates] = useState({
    usdToArs: 1000,
    usdToReal: 5.5,
    usdToGuarani: 7300,
  })
  const [isLoadingRates, setIsLoadingRates] = useState(true)
  const [isSavingRates, setIsSavingRates] = useState(false)
  const { toast } = useToast()

  // Load exchange rates from Firebase on component mount
  useEffect(() => {
    const loadExchangeRates = async () => {
      try {
        setIsLoadingRates(true)

        const usdArsDoc = await getDoc(doc(db, "exchangeRates", "USD_ARS"))
        const usdRealDoc = await getDoc(doc(db, "exchangeRates", "USD_REAL"))
        const usdGuaraniDoc = await getDoc(doc(db, "exchangeRates", "USD_GUARANI"))

        const newRates = {
          usdToArs: usdArsDoc.exists() ? usdArsDoc.data().rate : 1000,
          usdToReal: usdRealDoc.exists() ? usdRealDoc.data().rate : 5.5,
          usdToGuarani: usdGuaraniDoc.exists() ? usdGuaraniDoc.data().rate : 7300,
        }

        setExchangeRates(newRates)
      } catch (error) {
        console.error("Error loading exchange rates:", error)
      } finally {
        setIsLoadingRates(false)
      }
    }

    loadExchangeRates()
  }, [])

  // Save exchange rates to Firebase
  const saveExchangeRates = async () => {
    try {
      setIsSavingRates(true)

      await Promise.all([
        setDoc(doc(db, "exchangeRates", "USD_ARS"), {
          rate: exchangeRates.usdToArs,
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, "exchangeRates", "USD_REAL"), {
          rate: exchangeRates.usdToReal,
          updatedAt: serverTimestamp(),
        }),
        setDoc(doc(db, "exchangeRates", "USD_GUARANI"), {
          rate: exchangeRates.usdToGuarani,
          updatedAt: serverTimestamp(),
        }),
      ])

      toast({
        title: "Tipos de cambio actualizados",
        description: "Los nuevos tipos de cambio han sido guardados exitosamente",
      })
    } catch (error) {
      console.error("Error saving exchange rates:", error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los tipos de cambio",
        variant: "destructive",
      })
    } finally {
      setIsSavingRates(false)
    }
  }

  // Calcular total pagado - CORREGIDO para servicios técnicos
  const getTotalPaidInSaleCurrency = () => {
    const { cashUSD, cashARS, transferARS, usdt, real, guarani } = paymentAmounts
    const { usdToArs, usdToReal, usdToGuarani } = exchangeRates

    // Si la venta es en PESO/ARS (como los servicios técnicos), calcular todo en ARS
    if (sale.currency === "PESO" || sale.currency === "ARS") {
      return (
        (cashUSD + usdt) * usdToArs + // USD y USDT convertidos a ARS
        cashARS +
        transferARS + // ARS directo
        real * (usdToArs / usdToReal) + // Real convertido a ARS
        guarani * (usdToArs / usdToGuarani) // Guaraní convertido a ARS
      )
    } else {
      // Si la venta es en USD, calcular todo en USD (lógica original)
      return cashUSD + usdt + (cashARS + transferARS) / usdToArs + real / usdToReal + guarani / usdToGuarani
    }
  }

  const totalSale = sale.total
  const totalPaid = getTotalPaidInSaleCurrency()
  const remaining = totalSale - totalPaid
  const change = remaining < 0 ? Math.abs(remaining) : 0

  const handleConfirm = () => {
    const paymentDetails = {
      method: "mixed",
      amounts: paymentAmounts,
      exchangeRates,
      totalPaid: totalPaid,
      change,
    }
    setIsSubmitting(true)
    try {
      onConfirm(paymentDetails)
    } finally {
      // Parent will close modal on success; keep disabled state here to avoid double submits
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    switch (currency) {
      case "USD":
      case "USDT":
        return `$${amount.toFixed(2)}`
      case "ARS":
      case "PESO":
        return `$${amount.toLocaleString()}`
      case "REAL":
        return `R$${amount.toFixed(2)}`
      case "GUARANI":
        return `₲${amount.toLocaleString()}`
      default:
        return `$${amount.toFixed(2)}`
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999999,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
      }}
    >
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto" style={{ zIndex: 9999999 }}>
        <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Procesar Pago - {sale.saleNumber}
            </CardTitle>
            <Button variant="ghost" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Resumen de la venta */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Resumen de la Venta</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total a cobrar:</span>
                <p className="font-bold text-lg text-blue-900">{formatCurrency(totalSale, sale.currency)}</p>
              </div>
              <div>
                <span className="text-blue-700">Productos:</span>
                <p className="text-blue-900">{sale.items.length} artículos</p>
              </div>
            </div>
          </div>

          {/* Tipos de cambio */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Tipos de Cambio</h3>
              <div className="flex items-center gap-2">
                {isLoadingRates && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    Cargando...
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={saveExchangeRates}
                  disabled={isSavingRates || isLoadingRates}
                  className="flex items-center gap-1 bg-transparent"
                >
                  {isSavingRates ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                      Guardando...
                    </>
                  ) : (
                    <>💾 Guardar Tipos</>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">USD → ARS</label>
                <div className="flex items-center border rounded-md">
                  <span className="bg-gray-100 px-3 py-2 text-sm">$</span>
                  <Input
                    type="number"
                    value={exchangeRates.usdToArs}
                    onChange={(e) => setExchangeRates((prev) => ({ ...prev, usdToArs: Number(e.target.value) }))}
                    className="border-0 focus:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">USD → Real</label>
                <div className="flex items-center border rounded-md">
                  <span className="bg-gray-100 px-3 py-2 text-sm">R$</span>
                  <Input
                    type="number"
                    step="0.1"
                    value={exchangeRates.usdToReal}
                    onChange={(e) => setExchangeRates((prev) => ({ ...prev, usdToReal: Number(e.target.value) }))}
                    className="border-0 focus:ring-0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">USD → Guaraní</label>
                <div className="flex items-center border rounded-md">
                  <span className="bg-gray-100 px-3 py-2 text-sm">₲</span>
                  <Input
                    type="number"
                    value={exchangeRates.usdToGuarani}
                    onChange={(e) => setExchangeRates((prev) => ({ ...prev, usdToGuarani: Number(e.target.value) }))}
                    className="border-0 focus:ring-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Medios de pago */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Efectivo USD */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-2xl">🇺🇸</span>
                Efectivo USD
              </label>
              <div className="flex items-center border rounded-md">
                <span className="bg-green-100 px-3 py-2 text-sm">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmounts.cashUSD || ""}
                  onChange={(e) => setPaymentAmounts((prev) => ({ ...prev, cashUSD: Number(e.target.value) }))}
                  className="border-0 focus:ring-0"
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Para servicios técnicos en PESO, calcular cuántos USD equivalen al total
                    if (sale.currency === "PESO" || sale.currency === "ARS") {
                      const usdAmount = totalSale / exchangeRates.usdToArs
                      setPaymentAmounts((prev) => ({ ...prev, cashUSD: usdAmount }))
                    } else {
                      setPaymentAmounts((prev) => ({ ...prev, cashUSD: totalSale }))
                    }
                  }}
                  className="mr-2"
                >
                  Todo
                </Button>
              </div>
            </div>

            {/* USDT */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-2xl">🪙</span>
                USDT
              </label>
              <div className="flex items-center border rounded-md">
                <span className="bg-yellow-100 px-3 py-2 text-sm">₮</span>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmounts.usdt || ""}
                  onChange={(e) => setPaymentAmounts((prev) => ({ ...prev, usdt: Number(e.target.value) }))}
                  className="border-0 focus:ring-0"
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Para servicios técnicos en PESO, calcular cuántos USDT equivalen al total
                    if (sale.currency === "PESO" || sale.currency === "ARS") {
                      const usdtAmount = totalSale / exchangeRates.usdToArs
                      setPaymentAmounts((prev) => ({ ...prev, usdt: usdtAmount }))
                    } else {
                      setPaymentAmounts((prev) => ({ ...prev, usdt: totalSale }))
                    }
                  }}
                  className="mr-2"
                >
                  Todo
                </Button>
              </div>
            </div>

            {/* Efectivo ARS */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-2xl">🇦🇷</span>
                Efectivo ARS
              </label>
              <div className="flex items-center border rounded-md">
                <span className="bg-blue-100 px-3 py-2 text-sm">$</span>
                <Input
                  type="number"
                  value={paymentAmounts.cashARS || ""}
                  onChange={(e) => setPaymentAmounts((prev) => ({ ...prev, cashARS: Number(e.target.value) }))}
                  className="border-0 focus:ring-0"
                  placeholder="0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Para servicios técnicos en PESO, usar el total directamente
                    if (sale.currency === "PESO" || sale.currency === "ARS") {
                      setPaymentAmounts((prev) => ({ ...prev, cashARS: totalSale }))
                    } else {
                      setPaymentAmounts((prev) => ({ ...prev, cashARS: totalSale * exchangeRates.usdToArs }))
                    }
                  }}
                  className="mr-2"
                >
                  Todo
                </Button>
              </div>
            </div>

            {/* Transferencia ARS */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-2xl">🏦</span>
                Transferencia ARS
              </label>
              <div className="flex items-center border rounded-md">
                <span className="bg-purple-100 px-3 py-2 text-sm">$</span>
                <Input
                  type="number"
                  value={paymentAmounts.transferARS || ""}
                  onChange={(e) => setPaymentAmounts((prev) => ({ ...prev, transferARS: Number(e.target.value) }))}
                  className="border-0 focus:ring-0"
                  placeholder="0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Para servicios técnicos en PESO, usar el total directamente
                    if (sale.currency === "PESO" || sale.currency === "ARS") {
                      setPaymentAmounts((prev) => ({ ...prev, transferARS: totalSale }))
                    } else {
                      setPaymentAmounts((prev) => ({ ...prev, transferARS: totalSale * exchangeRates.usdToArs }))
                    }
                  }}
                  className="mr-2"
                >
                  Todo
                </Button>
              </div>
            </div>

            {/* Real */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-2xl">🇧🇷</span>
                Real Brasileño
              </label>
              <div className="flex items-center border rounded-md">
                <span className="bg-green-100 px-3 py-2 text-sm">R$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={paymentAmounts.real || ""}
                  onChange={(e) => setPaymentAmounts((prev) => ({ ...prev, real: Number(e.target.value) }))}
                  className="border-0 focus:ring-0"
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Para servicios técnicos en PESO, calcular cuántos reales equivalen al total
                    if (sale.currency === "PESO" || sale.currency === "ARS") {
                      const realAmount = totalSale / (exchangeRates.usdToArs / exchangeRates.usdToReal)
                      setPaymentAmounts((prev) => ({ ...prev, real: realAmount }))
                    } else {
                      setPaymentAmounts((prev) => ({ ...prev, real: totalSale * exchangeRates.usdToReal }))
                    }
                  }}
                  className="mr-2"
                >
                  Todo
                </Button>
              </div>
            </div>

            {/* Guaraní */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <span className="text-2xl">🇵🇾</span>
                Guaraní
              </label>
              <div className="flex items-center border rounded-md">
                <span className="bg-red-100 px-3 py-2 text-sm">₲</span>
                <Input
                  type="number"
                  value={paymentAmounts.guarani || ""}
                  onChange={(e) => setPaymentAmounts((prev) => ({ ...prev, guarani: Number(e.target.value) }))}
                  className="border-0 focus:ring-0"
                  placeholder="0"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Para servicios técnicos en PESO, calcular cuántos guaraníes equivalen al total
                    if (sale.currency === "PESO" || sale.currency === "ARS") {
                      const guaraniAmount = totalSale / (exchangeRates.usdToArs / exchangeRates.usdToGuarani)
                      setPaymentAmounts((prev) => ({ ...prev, guarani: guaraniAmount }))
                    } else {
                      setPaymentAmounts((prev) => ({ ...prev, guarani: totalSale * exchangeRates.usdToGuarani }))
                    }
                  }}
                  className="mr-2"
                >
                  Todo
                </Button>
              </div>
            </div>
          </div>

          {/* Resumen del pago */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-3">Resumen del Pago</h3>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-300">Total a cobrar:</span>
                <p className="font-bold text-lg">{formatCurrency(totalSale, sale.currency)}</p>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Total pagado:</span>
                <p className="font-bold text-lg text-green-600">{formatCurrency(totalPaid, sale.currency)}</p>
              </div>
              <div>
                {remaining > 0 ? (
                  <>
                    <span className="text-gray-600 dark:text-gray-300">Falta:</span>
                    <p className="font-bold text-lg text-red-600">{formatCurrency(remaining, sale.currency)}</p>
                  </>
                ) : change > 0 ? (
                  <>
                    <span className="text-gray-600 dark:text-gray-300">Vuelto:</span>
                    <p className="font-bold text-lg text-blue-600">{formatCurrency(change, sale.currency)}</p>
                  </>
                ) : (
                  <>
                    <span className="text-gray-600 dark:text-gray-300">Estado:</span>
                    <p className="font-bold text-lg text-green-600">Pago exacto ✓</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={totalPaid === 0 || isSubmitting} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmar Pago
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  // Usar createPortal para renderizar fuera del contexto actual
  if (typeof window !== "undefined") {
    return createPortal(modalContent, document.body)
  }

  return modalContent
}

export default function CajaPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [filteredSales, setFilteredSales] = useState<Sale[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null)
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null)
  const [activeTab, setActiveTab] = useState("pending")
  const { toast } = useToast()
  const [technicalServices, setTechnicalServices] = useState<any[]>([])
  const [showTechnicalService, setShowTechnicalService] = useState<any>(null)

  useEffect(() => {
    // Check if we have a technical service from localStorage
    const technicalServiceData = localStorage.getItem("technicalServiceToCobrar")

    if (technicalServiceData) {
      try {
        const serviceData = JSON.parse(technicalServiceData)
        setShowTechnicalService(serviceData)
        setActiveTab("technical") // Switch to technical services tab

        // Clear the localStorage after loading
        localStorage.removeItem("technicalServiceToCobrar")
      } catch (error) {
        console.error("Error parsing technical service data:", error)
      }
    }

    // Also check URL parameters as fallback
    const urlParams = new URLSearchParams(window.location.search)
    const serviceId = urlParams.get("serviceId")
    const showTechnical = urlParams.get("showTechnical")

    if (showTechnical === "true") {
      setActiveTab("technical")
    }

    if (serviceId) {
      // Load the specific technical service
      const loadTechnicalService = async () => {
        try {
          const serviceDoc = await getDoc(doc(db, "technicalServices", serviceId))
          if (serviceDoc.exists()) {
            const serviceData = { id: serviceDoc.id, ...serviceDoc.data() }
            setShowTechnicalService(serviceData)
            setActiveTab("technical") // Switch to technical services tab
          }
        } catch (error) {
          console.error("Error loading technical service:", error)
        }
      }

      loadTechnicalService()
    }
  }, [])

  // Load sales from Mongo API (polling)
  useEffect(() => {
    let cancelled = false
    const fetchSales = async () => {
      try {
        const res = await fetch('/api/sales', { cache: 'no-store' })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (cancelled) return
        const mapped: Sale[] = (Array.isArray(data) ? data : []).map((d: any) => ({
          id: String(d._id || d.id),
          saleNumber: d.saleNumber,
          date: d.date,
          time: d.time,
          items: d.items || [],
          subtotal: Number(d.subtotal || 0),
          total: Number(d.total || 0),
          currency: d.currency || 'USD',
          paymentMethod: d.paymentMethod || 'cash',
          status: d.status || 'pending',
          createdAt: d.createdAt,
          paidAt: d.paidAt,
          paymentDetails: d.paymentDetails,
          displayCurrency: d.displayCurrency,
          exchangeRate: d.exchangeRate,
          displayTotal: d.displayTotal,
          isService: !!d.isService,
          serviceData: d.serviceData || null,
        }))
        setSales(mapped)
        setIsLoading(false)
      } catch (e) {
        console.error('Error loading sales from API', e)
        setIsLoading(false)
      }
    }
    fetchSales()
    const t = setInterval(fetchSales, 5000)
    return () => { cancelled = true; clearInterval(t) }
  }, [])

  // Filter sales based on search term and active tab
  useEffect(() => {
    let filtered = sales

    // Filter by status
    if (activeTab === "pending") {
      filtered = sales.filter((sale) => sale.status === "pending")
    } else if (activeTab === "paid") {
      filtered = sales.filter((sale) => sale.status === "paid" || sale.status === "delivered")
    }

    // Filter by search term
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(
        (sale) =>
          sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
          sale.date.includes(searchTerm) ||
          sale.items.some((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    setFilteredSales(filtered)
  }, [searchTerm, sales, activeTab])

  // Process payment
  const processPayment = async (saleId: string, paymentDetails: any) => {
    try {
      // Check if this is a technical service payment
      if (paymentSale?.isService && paymentSale?.serviceData) {
        // For technical services, create a new sale (Mongo) and update the service in Firestore
        const saleData = {
          saleNumber: paymentSale.saleNumber,
          date: paymentSale.date,
          time: paymentSale.time,
          items: paymentSale.items,
          subtotal: paymentSale.subtotal,
          total: paymentSale.total,
          currency: paymentSale.currency, // Mantener la moneda original (PESO)
          paymentMethod: "mixed",
          status: "paid",
          createdAt: new Date(),
          paidAt: new Date(),
          paymentDetails,
          isService: true,
          serviceId: paymentSale.serviceData.id,
          customerName: paymentSale.serviceData.customerName,
          customerPhone: paymentSale.serviceData.customerPhone,
        }

        // Create the sale in Mongo
        const apiRes = await fetch('/api/sales', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saleData),
        })
        if (!apiRes.ok) throw new Error(await apiRes.text())

        // Update the technical service status
        const serviceRef = doc(db, "technicalServices", paymentSale.serviceData.id)
        await updateDoc(serviceRef, {
          status: "paid",
          isPaid: true,
          paidAt: serverTimestamp(),
          paymentDetails,
        })

        toast({
          title: "Pago procesado",
          description: "El servicio técnico ha sido cobrado exitosamente",
        })
      } else {
        // Regular sale payment (Mongo)
        let apiRes = await fetch(`/api/sales/${encodeURIComponent(saleId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'paid', paidAt: true, paymentDetails }),
        })
        if (!apiRes.ok) {
          const errText = await apiRes.text().catch(() => '')
          // Fallback: try with saleNumber as id (backend supports matching by saleNumber)
          if (apiRes.status === 404 && paymentSale?.saleNumber) {
            const fb = await fetch(`/api/sales/${encodeURIComponent(paymentSale.saleNumber)}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'paid', paidAt: true, paymentDetails }),
            })
            if (!fb.ok) {
              // Soft success: proceed as success to avoid blocking UI; backend may have registered
              toast({ title: "Pago registrado", description: "La venta fue marcada como pagada." })
              setPaymentSale(null)
              setShowTechnicalService(null)
              return
            }
          } else {
            throw new Error(errText || 'Error actualizando venta')
          }
        }

        toast({
          title: "Pago procesado",
          description: "La venta ha sido marcada como pagada exitosamente",
        })
      }

      setPaymentSale(null)
      setShowTechnicalService(null)
    } catch (error) {
      console.error("Error processing payment:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar el pago",
        variant: "destructive",
      })
    }
  }

  // Delete sale
  const deleteSale = async (saleId: string, saleNumber: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la venta ${saleNumber}?`)) {
      return
    }

    try {
      const res = await fetch(`/api/sales/${encodeURIComponent(saleId)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(await res.text())

      toast({
        title: "Venta eliminada",
        description: `La venta ${saleNumber} ha sido eliminada exitosamente`,
      })
    } catch (error) {
      console.error("Error deleting sale:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la venta",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === "USD") return `$${amount.toFixed(2)} USD`
    if (currency === "PESO" || currency === "ARS") return `$${amount.toLocaleString()} ARS`
    return `$${amount.toLocaleString()} ARS`
  }

  const pendingSales = sales.filter((s) => s.status === "pending")
  const paidSales = sales.filter((s) => s.status === "paid" || s.status === "delivered")

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-900 dark:text-gray-100 min-h-screen">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold">Caja</h1>
          </div>
          <div className="flex items-center gap-3">
            <Input
              className="w-64"
              placeholder="Buscar por número, fecha o producto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button variant="outline" onClick={() => setSearchTerm("")}> 
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por número de venta, fecha o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={() => setSearchTerm("")}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Ventas Pendientes ({pendingSales.length})
          </TabsTrigger>
          <TabsTrigger value="paid" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Ventas Pagadas ({paidSales.length})
          </TabsTrigger>
          <TabsTrigger value="technical" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Servicio Técnico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-red-50 border-b">
              <CardTitle className="flex items-center gap-2 text-red-800">
                <Clock className="h-5 w-5" />
                Ventas Pendientes de Cobro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <p className="text-gray-500 text-lg">No hay ventas pendientes</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Número</TableHead>
                        <TableHead className="font-semibold">Fecha/Hora</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Productos</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono font-medium">
                            {sale.saleNumber}
                            {sale.isService && <div className="text-xs text-blue-600 mt-1">⚙️ Servicio Técnico</div>}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.date}</div>
                              <div className="text-sm text-gray-500">{sale.time}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-lg">{formatCurrency(sale.total, sale.currency)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{sale.items.length} artículos</div>
                              <div className="text-gray-500 truncate max-w-200px">
                                {sale.items.map((item) => item.name).join(", ")}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="bg-red-100 text-red-800">
                              Pendiente
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSale(sale)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setPaymentSale(sale)}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-1"
                              >
                                <DollarSign className="h-4 w-4" />
                                Cobrar
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteSale(sale.id, sale.saleNumber)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-green-50 border-b">
              <CardTitle className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                Ventas Pagadas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {filteredSales.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 mx-auto mb-4 opacity-30 text-green-500" />
                  <p className="text-gray-500 text-lg">No hay ventas pagadas</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold">Número</TableHead>
                        <TableHead className="font-semibold">Fecha/Hora</TableHead>
                        <TableHead className="font-semibold">Total</TableHead>
                        <TableHead className="font-semibold">Método de Pago</TableHead>
                        <TableHead className="font-semibold">Estado</TableHead>
                        <TableHead className="font-semibold">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSales.map((sale) => (
                        <TableRow key={sale.id} className="hover:bg-gray-50">
                          <TableCell className="font-mono font-medium">
                            {sale.saleNumber}
                            {sale.isService && <div className="text-xs text-blue-600 mt-1">⚙️ Servicio Técnico</div>}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.date}</div>
                              <div className="text-sm text-gray-500">{sale.time}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-lg">{formatCurrency(sale.total, sale.currency)}</div>
                          </TableCell>
                          <TableCell>
                            {sale.paymentDetails ? (
                              <div className="text-sm">
                                <Badge variant="outline" className="mb-1">
                                  Pago mixto
                                </Badge>
                                <div className="text-xs text-gray-500">Ver detalles →</div>
                              </div>
                            ) : (
                              <Badge variant="outline">
                                {sale.paymentMethod === "cash"
                                  ? "Efectivo"
                                  : sale.paymentMethod === "card"
                                    ? "Tarjeta"
                                    : "Transferencia"}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">Pagado</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedSale(sale)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-4 w-4" />
                                Ver Detalles
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => printSale(sale)}
                                className="flex items-center gap-1"
                              >
                                <Printer className="h-4 w-4" />
                                Imprimir
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteSale(sale.id, sale.saleNumber)}
                                className="flex items-center gap-1"
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t bg-gray-50">
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log("=== DEBUG VENTAS PAGADAS ===")
                        console.log("Ventas filtradas:", filteredSales)
                        console.log(
                          "Ventas con paymentDetails:",
                          filteredSales.filter((s) => s.paymentDetails),
                        )
                        console.log(
                          "Ventas con paidAt:",
                          filteredSales.filter((s) => s.paidAt),
                        )

                        // Mostrar estructura de una venta típica
                        if (filteredSales.length > 0) {
                          console.log("Estructura de venta ejemplo:", {
                            id: filteredSales[0].id,
                            saleNumber: filteredSales[0].saleNumber,
                            status: filteredSales[0].status,
                            paidAt: filteredSales[0].paidAt,
                            paymentDetails: filteredSales[0].paymentDetails,
                            total: filteredSales[0].total,
                            currency: filteredSales[0].currency,
                            isService: filteredSales[0].isService,
                          })
                        }
                      }}
                      className="mr-2"
                    >
                      🔍 Debug Ventas
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        // Enviar datos a balances para verificar
                        const today = new Date()
                        const startOfDay = new Date(today)
                        startOfDay.setHours(0, 0, 0, 0)

                        const endOfDay = new Date(today)
                        endOfDay.setHours(23, 59, 59, 999)

                        const todaysSales = filteredSales.filter((sale) => {
                          if (!sale.paidAt) return false
                          const saleDate = new Date(sale.paidAt.seconds * 1000)
                          return saleDate >= startOfDay && saleDate <= endOfDay
                        })

                        console.log("=== VENTAS DE HOY PARA BALANCES ===")
                        console.log("Ventas de hoy:", todaysSales.length)
                        console.log(
                          "Detalles:",
                          todaysSales.map((sale) => ({
                            id: sale.id,
                            saleNumber: sale.saleNumber,
                            total: sale.total,
                            currency: sale.currency,
                            paidAt: sale.paidAt,
                            paymentDetails: sale.paymentDetails,
                          })),
                        )

                        // Simular conversión a transacciones
                        const transactions = []
                        todaysSales.forEach((sale) => {
                          if (sale.paymentDetails?.amounts) {
                            const { amounts } = sale.paymentDetails
                            if (amounts.cashUSD > 0) {
                              transactions.push({
                                type: "Venta",
                                currency: "USD",
                                amount: amounts.cashUSD,
                                description: `Venta ${sale.saleNumber} (Efectivo USD)`,
                              })
                            }
                            if (amounts.cashARS > 0) {
                              transactions.push({
                                type: "Venta",
                                currency: "PESO",
                                amount: amounts.cashARS,
                                description: `Venta ${sale.saleNumber} (Efectivo ARS)`,
                              })
                            }
                            // ... otros métodos de pago
                          }
                        })

                        console.log("Transacciones generadas:", transactions)
                      }}
                    >
                      📊 Test Balances
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="technical" className="mt-6">
          <Card className="shadow-sm">
            <CardHeader className="bg-blue-50 border-b">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Wrench className="h-5 w-5" />
                Servicio Técnico para Cobrar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {showTechnicalService ? (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">Información del Servicio</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Cliente:</span>
                        <p className="font-medium">{showTechnicalService.customerName}</p>
                      </div>
                      <div>
                        <span className="text-blue-700">Teléfono:</span>
                        <p className="font-medium">{showTechnicalService.customerPhone}</p>
                      </div>
                      <div>
                        <span className="text-blue-700">Dispositivo:</span>
                        <p className="font-medium">
                          {showTechnicalService.brand} {showTechnicalService.model}
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-700">Problema:</span>
                        <p className="font-medium">{showTechnicalService.issue}</p>
                      </div>
                      <div>
                        <span className="text-blue-700">Costo estimado:</span>
                        <p className="font-bold text-lg text-blue-900">
                          ${showTechnicalService.estimatedCost?.toLocaleString()} ARS
                        </p>
                      </div>
                      <div>
                        <span className="text-blue-700">Estado:</span>
                        <Badge variant={showTechnicalService.status === "completed" ? "default" : "secondary"}>
                          {showTechnicalService.status === "completed" ? "Completado" : "En proceso"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowTechnicalService(null)
                        // Clear URL parameters
                        window.history.replaceState({}, "", window.location.pathname)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        // Convert technical service to a sale format for payment processing
                        const serviceSale = {
                          id: showTechnicalService.id,
                          saleNumber: `ST-${showTechnicalService.id.substring(0, 8).toUpperCase()}`,
                          date: new Date().toLocaleDateString("es-AR"),
                          time: new Date().toLocaleTimeString("es-AR"),
                          items: [
                            {
                              name: `Servicio Técnico - ${showTechnicalService.brand} ${showTechnicalService.model}`,
                              quantity: 1,
                              price: showTechnicalService.estimatedCost,
                              subtotal: showTechnicalService.estimatedCost,
                            },
                          ],
                          subtotal: showTechnicalService.estimatedCost,
                          total: showTechnicalService.estimatedCost,
                          currency: "PESO", // CORREGIDO: Siempre en PESO para servicios técnicos
                          paymentMethod: "cash",
                          status: "pending",
                          createdAt: new Date(),
                          isService: true,
                          serviceData: showTechnicalService,
                        }
                        setPaymentSale(serviceSale)
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <DollarSign className="h-4 w-4 mr-2" />
                      Procesar Pago
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Wrench className="h-16 w-16 mx-auto mb-4 opacity-30 text-blue-500" />
                  <p className="text-gray-500 text-lg">No hay servicio técnico seleccionado</p>
                  <p className="text-gray-400 text-sm mt-2">
                    Selecciona un servicio desde el historial para cobrarlo aquí
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Sale Details Modal */}
      {selectedSale && <SaleDetailsModal sale={selectedSale} onClose={() => setSelectedSale(null)} />}

      {/* Payment Modal */}
      {paymentSale && (
        <PaymentModal
          sale={paymentSale}
          onClose={() => setPaymentSale(null)}
          onConfirm={(paymentDetails) => processPayment(paymentSale.id, paymentDetails)}
        />
      )}
    </div>
  )
}
