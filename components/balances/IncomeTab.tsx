"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Minus, DollarSign } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { Currency } from "@/models/Currency"

const CURRENCY_INFO: Record<Currency, { symbol: string; label: string; gradient: string }> = {
  USD: { symbol: "$", label: "Dólares", gradient: "from-green-400 to-emerald-500" },
  USDT: { symbol: "₮", label: "USDT", gradient: "from-emerald-400 to-teal-500" },
  PESO: { symbol: "$", label: "Pesos (Efectivo)", gradient: "from-blue-400 to-indigo-500" },
  PESO_TRANSFERENCIA: { symbol: "$", label: "Pesos (Transferencia)", gradient: "from-indigo-400 to-purple-500" },
  REAL: { symbol: "R$", label: "Reales", gradient: "from-yellow-400 to-orange-500" },
  GUARANI: { symbol: "₲", label: "Guaraníes", gradient: "from-red-400 to-pink-500" },
}

interface DailyBreakdown {
  income: number
  expense: number
  balance: number
}

interface IncomeTabProps {
  dailyBreakdown: Record<Currency, DailyBreakdown>
  selectedDate: Date
  isLoading: boolean
  onCurrencyClick: (currency: Currency) => void
  onIncomeClick: (currency: Currency) => void
}

const CurrencyCardSkeleton = () => (
  <Card className="animate-pulse">
    <CardHeader>
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 mx-auto"></div>
      <Separator />
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-md"></div>
      </div>
    </CardContent>
  </Card>
)

export function IncomeTab({ dailyBreakdown, isLoading, onCurrencyClick, onIncomeClick, selectedDate }: IncomeTabProps) {
  const formatCurrency = (amount: number, currency: Currency) => {
    const { symbol } = CURRENCY_INFO[currency]
    return new Intl.NumberFormat("es-AR", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace(/^/, `${symbol} `)
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <CurrencyCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {Object.entries(CURRENCY_INFO).map(([currency, info]) => {
        const { income, expense, balance } = dailyBreakdown[currency as Currency] || {
          income: 0,
          expense: 0,
          balance: 0,
        }
        const hasPositiveBalance = balance > 0
        const hasNegativeBalance = balance < 0

        return (
          <Card
            key={currency}
            className={`transition-all duration-300 hover:shadow-xl transform hover:scale-105 ${
              hasPositiveBalance
                ? "border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg"
                : hasNegativeBalance
                  ? "border-red-300 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg"
                  : "border-gray-200 bg-white hover:border-gray-300 shadow-md"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {currency === "USD" && "🇺🇸"}
                    {currency === "USDT" && "🪙"}
                    {currency === "PESO" && "🇦🇷"}
                    {currency === "PESO_TRANSFERENCIA" && "🏦"}
                    {currency === "REAL" && "🇧🇷"}
                    {currency === "GUARANI" && "🇵🇾"}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{info.label}</span>
                </div>
                <DollarSign className="h-4 w-4 text-gray-500" />
              </div>

              <div className="space-y-4">
                {/* Balance Neto */}
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Balance Neto</p>
                  <div
                    className={`text-3xl font-bold ${
                      hasPositiveBalance ? "text-green-700" : hasNegativeBalance ? "text-red-700" : "text-gray-700"
                    }`}
                  >
                    {balance >= 0 ? "+" : ""}
                    {formatCurrency(balance, currency as Currency)}
                  </div>
                  <Badge
                    variant={hasPositiveBalance ? "default" : hasNegativeBalance ? "destructive" : "secondary"}
                    className="mt-2"
                  >
                    {currency}
                  </Badge>
                </div>

                {/* Ingresos y Egresos */}
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600 font-medium mb-1">Ingresos</p>
                    <p className="text-lg font-bold text-green-700">{formatCurrency(income, currency as Currency)}</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-red-600 font-medium mb-1">Egresos</p>
                    <p className="text-lg font-bold text-red-700">{formatCurrency(expense, currency as Currency)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                    onClick={() => onIncomeClick(currency as Currency)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Ingreso
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50 bg-white shadow-md"
                    onClick={() => onCurrencyClick(currency as Currency)}
                  >
                    <Minus className="h-3 w-3 mr-1" />
                    Egreso
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
