"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExpenseForm } from "./ExpenseForm"
import type { Currency } from "@/models/Currency"

const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "Dólares (Efectivo)",
  USDT: "USDT",
  PESO: "Pesos (Efectivo)",
  PESO_TRANSFERENCIA: "Pesos (Transferencia)",
  REAL: "Reales",
  GUARANI: "Guaraníes",
}

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  currency: Currency | null
  onExpenseAdded: () => void
}

export function ExpenseModal({ isOpen, onClose, currency, onExpenseAdded }: ExpenseModalProps) {
  const handleExpenseAdded = () => {
    onExpenseAdded()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Egreso</DialogTitle>
          <DialogDescription>
            {currency
              ? `Registra un nuevo gasto en ${CURRENCY_LABELS[currency]}`
              : "Registra un nuevo gasto seleccionando la moneda"}
          </DialogDescription>
        </DialogHeader>

        <ExpenseForm
          onExpenseAdded={handleExpenseAdded}
          preselectedCurrency={currency}
          showCurrencySelector={!currency}
        />
      </DialogContent>
    </Dialog>
  )
}
