"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RefreshCw } from "lucide-react"
import type { Currency } from "./types"
import { convertCurrency, conversionRates, formatCurrency } from "./currency-utils"

export function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState<Currency>("USD")
  const [toCurrency, setToCurrency] = useState<Currency>("PESO")
  const [amount, setAmount] = useState("")
  const [result, setResult] = useState<number | null>(null)

  const handleConvert = () => {
    if (!amount || Number.parseFloat(amount) <= 0) return

    const convertedAmount = convertCurrency(Number.parseFloat(amount), fromCurrency, toCurrency)
    setResult(convertedAmount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Conversor de Monedas
        </CardTitle>
        <CardDescription>Calcule equivalencias entre monedas</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="from-amount">Monto</Label>
              <Input
                id="from-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor="from-currency">De</Label>
              <Select value={fromCurrency} onValueChange={(value) => setFromCurrency(value as Currency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Moneda origen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="PESO">PESO</SelectItem>
                  <SelectItem value="PESO_TRANSFERENCIA">PESO TRANSF.</SelectItem>
                  <SelectItem value="REAL">REAL</SelectItem>
                  <SelectItem value="GUARANI">GUARANÍ</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="to-currency">A</Label>
              <Select value={toCurrency} onValueChange={(value) => setToCurrency(value as Currency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Moneda destino" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="USDT">USDT</SelectItem>
                  <SelectItem value="PESO">PESO</SelectItem>
                  <SelectItem value="PESO_TRANSFERENCIA">PESO TRANSF.</SelectItem>
                  <SelectItem value="REAL">REAL</SelectItem>
                  <SelectItem value="GUARANI">GUARANÍ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleConvert}>
              <RefreshCw className="mr-2 h-4 w-4" /> Convertir
            </Button>
          </div>

          {result !== null && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Resultado de la conversión</p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <p className="text-xl font-bold">
                    {formatCurrency(Number.parseFloat(amount), fromCurrency)} = {formatCurrency(result, toCurrency)}
                  </p>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Tasa: 1 {fromCurrency} = {conversionRates[fromCurrency]?.[toCurrency]} {toCurrency}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
