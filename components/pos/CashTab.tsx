"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Wallet, TrendingUp, TrendingDown, Calculator, DollarSign, ArrowUpDown } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface CashBalance {
  currency: string
  amount: number
  symbol: string
  rate: number // Rate to USD
}

interface CashMovement {
  id: string
  type: "income" | "expense"
  amount: number
  currency: string
  description: string
  timestamp: Date
}

// Mock exchange rates (to USD)
const exchangeRates = {
  USD: 1,
  PESO: 0.0028, // 1 USD = ~350 PESO
  USDT: 1,
  REAL: 0.2, // 1 USD = ~5 REAL
  GUARANI: 0.00014, // 1 USD = ~7000 GUARANI
}

export function CashTab() {
  const [balances, setBalances] = useState<CashBalance[]>([
    { currency: "USD", amount: 500, symbol: "$", rate: exchangeRates.USD },
    { currency: "PESO", amount: 175000, symbol: "$", rate: exchangeRates.PESO },
    { currency: "USDT", amount: 300, symbol: "₮", rate: exchangeRates.USDT },
    { currency: "REAL", amount: 2500, symbol: "R$", rate: exchangeRates.REAL },
    { currency: "GUARANI", amount: 3500000, symbol: "₲", rate: exchangeRates.GUARANI },
  ])

  const [movements, setMovements] = useState<CashMovement[]>([
    {
      id: "1",
      type: "income",
      amount: 150,
      currency: "USD",
      description: "Venta de iPhone 14",
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
    },
    {
      id: "2",
      type: "expense",
      amount: 50000,
      currency: "PESO",
      description: "Compra de accesorios",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  ])

  const [newMovement, setNewMovement] = useState({
    type: "income" as "income" | "expense",
    amount: "",
    currency: "USD",
    description: "",
  })

  const [converter, setConverter] = useState({
    fromCurrency: "USD",
    toCurrency: "PESO",
    amount: "",
    result: "",
  })

  const { toast } = useToast()

  // Calculate total balance in USD
  const totalBalanceUSD = balances.reduce((total, balance) => {
    return total + balance.amount * balance.rate
  }, 0)

  // Add new movement
  const addMovement = () => {
    if (!newMovement.amount || !newMovement.description) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(newMovement.amount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Monto inválido",
        description: "Por favor ingresa un monto válido",
        variant: "destructive",
      })
      return
    }

    // Update balance
    setBalances(
      balances.map((balance) => {
        if (balance.currency === newMovement.currency) {
          const newAmount = newMovement.type === "income" ? balance.amount + amount : balance.amount - amount

          if (newAmount < 0) {
            toast({
              title: "Saldo insuficiente",
              description: `No hay suficiente saldo en ${newMovement.currency}`,
              variant: "destructive",
            })
            return balance
          }

          return { ...balance, amount: newAmount }
        }
        return balance
      }),
    )

    // Add movement to history
    const movement: CashMovement = {
      id: Date.now().toString(),
      type: newMovement.type,
      amount,
      currency: newMovement.currency,
      description: newMovement.description,
      timestamp: new Date(),
    }

    setMovements([movement, ...movements])

    // Reset form
    setNewMovement({
      type: "income",
      amount: "",
      currency: "USD",
      description: "",
    })

    toast({
      title: "Movimiento registrado",
      description: `${newMovement.type === "income" ? "Ingreso" : "Egreso"} de ${amount} ${newMovement.currency} registrado`,
    })
  }

  // Currency converter
  const convertCurrency = () => {
    const amount = Number.parseFloat(converter.amount)
    if (isNaN(amount) || amount <= 0) {
      setConverter({ ...converter, result: "" })
      return
    }

    const fromRate = exchangeRates[converter.fromCurrency as keyof typeof exchangeRates]
    const toRate = exchangeRates[converter.toCurrency as keyof typeof exchangeRates]

    // Convert to USD first, then to target currency
    const usdAmount = amount * fromRate
    const result = usdAmount / toRate

    setConverter({ ...converter, result: result.toFixed(2) })
  }

  useEffect(() => {
    convertCurrency()
  }, [converter.amount, converter.fromCurrency, converter.toCurrency])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Balances Section */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Balances de Caja
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {balances.map((balance) => (
                <div key={balance.currency} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">{balance.currency}</span>
                    <Badge variant="outline">{balance.symbol}</Badge>
                  </div>
                  <div className="text-2xl font-bold">
                    {balance.symbol}
                    {balance.amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">≈ ${(balance.amount * balance.rate).toFixed(2)} USD</div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total en USD:</span>
                <span className="text-2xl font-bold text-green-600">${totalBalanceUSD.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Movements History */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {movement.type === "income" ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{movement.description}</p>
                      <p className="text-xs text-gray-600">{movement.timestamp.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${movement.type === "income" ? "text-green-600" : "text-red-600"}`}>
                      {movement.type === "income" ? "+" : "-"}
                      {movement.amount} {movement.currency}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Section */}
      <div className="space-y-4">
        {/* New Movement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Nuevo Movimiento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Select
                value={newMovement.type}
                onValueChange={(value: "income" | "expense") => setNewMovement({ ...newMovement, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Ingreso</SelectItem>
                  <SelectItem value="expense">Egreso</SelectItem>
                </SelectContent>
              </Select>

              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Monto"
                  value={newMovement.amount}
                  onChange={(e) => setNewMovement({ ...newMovement, amount: e.target.value })}
                />
                <Select
                  value={newMovement.currency}
                  onValueChange={(value) => setNewMovement({ ...newMovement, currency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="PESO">PESO</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="REAL">REAL</SelectItem>
                    <SelectItem value="GUARANI">GUARANÍ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Textarea
                placeholder="Descripción del movimiento"
                value={newMovement.description}
                onChange={(e) => setNewMovement({ ...newMovement, description: e.target.value })}
              />

              <Button className="w-full" onClick={addMovement}>
                Registrar Movimiento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Currency Converter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Conversor de Monedas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="number"
                placeholder="Monto a convertir"
                value={converter.amount}
                onChange={(e) => setConverter({ ...converter, amount: e.target.value })}
              />

              <div className="flex items-center gap-2">
                <Select
                  value={converter.fromCurrency}
                  onValueChange={(value) => setConverter({ ...converter, fromCurrency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="PESO">PESO</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="REAL">REAL</SelectItem>
                    <SelectItem value="GUARANI">GUARANÍ</SelectItem>
                  </SelectContent>
                </Select>

                <ArrowUpDown className="h-4 w-4 text-gray-400" />

                <Select
                  value={converter.toCurrency}
                  onValueChange={(value) => setConverter({ ...converter, toCurrency: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="PESO">PESO</SelectItem>
                    <SelectItem value="USDT">USDT</SelectItem>
                    <SelectItem value="REAL">REAL</SelectItem>
                    <SelectItem value="GUARANI">GUARANÍ</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {converter.result && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-center">
                    <span className="font-bold text-lg">
                      {converter.result} {converter.toCurrency}
                    </span>
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
