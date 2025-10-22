"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DollarSign, CreditCard, Banknote } from "lucide-react"
import type { CashBalance as CashBalanceType } from "./types"
import { formatCurrency } from "./currency-utils"

export function CashBalance() {
  // Estado inicial de la caja (ejemplo)
  const [balance, setBalance] = useState<CashBalanceType>({
    USD: 1000,
    USDT: 500,
    PESO: 50000,
    PESO_TRANSFERENCIA: 25000,
    REAL: 2000,
    GUARANI: 1000000,
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Banknote className="h-5 w-5" />
          Balance de Caja
        </CardTitle>
        <CardDescription>Saldos actuales por moneda</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium">USD</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  Efectivo
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(balance.USD, "USD")}</p>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium">USDT</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  Digital
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(balance.USDT, "USDT")}</p>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 dark:bg-yellow-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                  <span className="font-medium">PESO</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  Efectivo
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(balance.PESO, "PESO")}</p>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <span className="font-medium">PESO TRANSF.</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  Digital
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">
                {formatCurrency(balance.PESO_TRANSFERENCIA, "PESO_TRANSFERENCIA")}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 dark:bg-emerald-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-medium">REAL</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  Efectivo
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(balance.REAL, "REAL")}</p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 dark:bg-purple-900/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <span className="font-medium">GUARANÍ</span>
                </div>
                <Badge variant="outline" className="bg-white dark:bg-gray-800">
                  Efectivo
                </Badge>
              </div>
              <p className="text-2xl font-bold mt-2">{formatCurrency(balance.GUARANI, "GUARANI")}</p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
