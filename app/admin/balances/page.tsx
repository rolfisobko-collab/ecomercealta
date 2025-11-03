"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { IncomeTab } from "@/components/balances/IncomeTab"
import { ExpenseList } from "@/components/balances/ExpenseList"
import { ExpenseModal } from "@/components/balances/ExpenseModal"
import { IncomeModal } from "@/components/balances/IncomeModal"
import { cashRegisterService } from "@/services/api/cashRegisterService"
import type { Transaction } from "@/models/CashRegister"
import type { Currency } from "@/models/Currency"
import { AdminPasswordProtection } from "@/components/admin/AdminPasswordProtection"

interface DailyBreakdown {
  income: number
  expense: number
  balance: number
}

export default function BalancesPage() {
  const [date, setDate] = useState<Date>(new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | null>(null)
  const [dailyBreakdown, setDailyBreakdown] = useState<
    Record<Currency, { income: number; expense: number; balance: number }>
  >({
    USD: { income: 0, expense: 0, balance: 0 },
    USDT: { income: 0, expense: 0, balance: 0 },
    PESO: { income: 0, expense: 0, balance: 0 },
    PESO_TRANSFERENCIA: { income: 0, expense: 0, balance: 0 },
    REAL: { income: 0, expense: 0, balance: 0 },
    GUARANI: { income: 0, expense: 0, balance: 0 },
  })
  const [dailyTransactions, setDailyTransactions] = useState<Transaction[]>([])

  const loadDailyData = async (date: Date) => {
    setIsLoading(true)
    try {
      console.log("Cargando datos para fecha:", date.toISOString())

      // Usar la nueva función getTransactionsByDate
      const transactions = await cashRegisterService.getTransactionsByDate(date)

      console.log("Transacciones obtenidas:", transactions.length)

      // Calculate breakdown from actual transactions
      const breakdown: Record<Currency, { income: number; expense: number; balance: number }> = {
        USD: { income: 0, expense: 0, balance: 0 },
        USDT: { income: 0, expense: 0, balance: 0 },
        PESO: { income: 0, expense: 0, balance: 0 },
        PESO_TRANSFERENCIA: { income: 0, expense: 0, balance: 0 },
        REAL: { income: 0, expense: 0, balance: 0 },
        GUARANI: { income: 0, expense: 0, balance: 0 },
      }

      // Process each transaction (incluye ventas de caja y transacciones manuales)
      transactions.forEach((transaction: Transaction) => {
        console.log("Procesando transacción para balance:", {
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          description: transaction.description,
        })

        const amount = Math.abs(transaction.amount)

        if (transaction.type === "Ingreso" || transaction.type === "Venta") {
          breakdown[transaction.currency].income += amount
          breakdown[transaction.currency].balance += amount
        } else if (transaction.type === "Egreso") {
          breakdown[transaction.currency].expense += amount
          breakdown[transaction.currency].balance -= amount
        }
      })

      console.log("Breakdown final calculado:", breakdown)

      // Sort transactions by time (most recent first)
      transactions.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

      setDailyBreakdown(breakdown)
      setDailyTransactions(transactions)
    } catch (error) {
      console.error("Error loading daily data:", error)
      setDailyBreakdown({
        USD: { income: 0, expense: 0, balance: 0 },
        USDT: { income: 0, expense: 0, balance: 0 },
        PESO: { income: 0, expense: 0, balance: 0 },
        PESO_TRANSFERENCIA: { income: 0, expense: 0, balance: 0 },
        REAL: { income: 0, expense: 0, balance: 0 },
        GUARANI: { income: 0, expense: 0, balance: 0 },
      })
      setDailyTransactions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      setIsLoading(true)
      const success = await cashRegisterService.deleteTransaction(transactionId)
      if (success) {
        // Reload data after deletion
        await loadDailyData(date)
      } else {
        alert("Error al eliminar la transacción")
      }
    } catch (error) {
      console.error("Error deleting transaction:", error)
      alert("Error al eliminar la transacción")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadDailyData(date)
  }, [date])

  const handleOpenExpenseModal = (currency: Currency) => {
    setSelectedCurrency(currency)
    setIsExpenseModalOpen(true)
  }

  const handleOpenIncomeModal = (currency: Currency) => {
    setSelectedCurrency(currency)
    setIsIncomeModalOpen(true)
  }

  const handleModalClose = () => {
    setIsExpenseModalOpen(false)
    setIsIncomeModalOpen(false)
    setSelectedCurrency(null)
    loadDailyData(date)
  }

  return (
    <AdminPasswordProtection>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Balances Diarios
            </h1>
            <p className="text-lg text-muted-foreground">
              Gestiona los ingresos y egresos de tu negocio con control total por fecha
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[280px] justify-start text-left font-normal bg-white shadow-sm border-2"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: es }) : <span>Seleccionar fecha</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(newDate) => newDate && setDate(newDate)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white/80 backdrop-blur-sm border-0 rounded-lg shadow-xl">
          <Tabs defaultValue="balance" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-100 m-6 mb-0">
              <TabsTrigger
                value="balance"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white font-medium"
              >
                💰 Balance
              </TabsTrigger>
              <TabsTrigger
                value="historial"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white font-medium"
              >
                📋 Historial
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="balance" className="space-y-6 mt-0">
                <IncomeTab
                  dailyBreakdown={dailyBreakdown}
                  selectedDate={date}
                  isLoading={isLoading}
                  onCurrencyClick={handleOpenExpenseModal}
                  onIncomeClick={handleOpenIncomeModal}
                />
              </TabsContent>

              <TabsContent value="historial" className="space-y-6 mt-0">
                <ExpenseList
                  expenses={dailyTransactions}
                  selectedDate={date}
                  isLoading={isLoading}
                  onDeleteTransaction={handleDeleteTransaction}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Modals */}
        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={handleModalClose}
          currency={selectedCurrency}
          onExpenseAdded={handleModalClose}
        />

        <IncomeModal
          isOpen={isIncomeModalOpen}
          onClose={handleModalClose}
          currency={selectedCurrency}
          onIncomeAdded={handleModalClose}
        />
      </div>
    </div>
    </AdminPasswordProtection>
  )
}
