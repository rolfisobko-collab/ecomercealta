"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useCurrency } from "@/context/CurrencyContext"
import { fetchExchangeRate } from "@/utils/currencyUtils"
import { ChevronDown, DollarSign, Banknote } from "lucide-react"

export function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()
  const [exchangeRate, setExchangeRate] = useState<number>(1300)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const loadExchangeRate = async () => {
      setIsLoading(true)
      try {
        const rate = await fetchExchangeRate("USD_ARS")
        setExchangeRate(rate)
      } catch (error) {
        console.error("Error loading exchange rate:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadExchangeRate()

    // Actualizar cada 5 minutos
    const interval = setInterval(loadExchangeRate, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const formatExchangeRate = (rate: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rate)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 hover:bg-white dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center space-x-2">
            {currency === "USD" ? (
              <DollarSign className="h-4 w-4 text-green-600" />
            ) : (
              <Banknote className="h-4 w-4 text-blue-600" />
            )}
            <span className="font-medium">{currency === "USD" ? "USD" : "ARS"}</span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl"
      >
        <div className="p-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tipo de cambio</span>
            <Badge
              variant="secondary"
              className="bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 text-gray-700 dark:text-gray-300"
            >
              {isLoading ? "..." : `1 USD = ${formatExchangeRate(exchangeRate)}`}
            </Badge>
          </div>
        </div>

        <DropdownMenuItem
          onClick={() => setCurrency("ARS")}
          className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
            currency === "ARS" ? "bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
        >
          <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
            <Banknote className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">Pesos Argentinos</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Moneda local (ARS)</div>
          </div>
          {currency === "ARS" && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setCurrency("USD")}
          className={`flex items-center space-x-3 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
            currency === "USD" ? "bg-green-50 dark:bg-green-900/20" : ""
          }`}
        >
          <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
            <DollarSign className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900 dark:text-gray-100">Dólares Americanos</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Moneda internacional (USD)</div>
          </div>
          {currency === "USD" && <div className="w-2 h-2 bg-green-500 rounded-full"></div>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
