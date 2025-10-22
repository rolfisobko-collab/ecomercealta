"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { IncomeForm } from "./IncomeForm"
import type { Currency } from "@/models/Currency"

const CURRENCY_LABELS: Record<Currency, string> = {
  USD: "Dólares (Efectivo)",
  USDT: "USDT",
  PESO: "Pesos (Efectivo)",
  PESO_TRANSFERENCIA: "Pesos (Transferencia)",
  REAL: "Reales",
  GUARANI: "Guaraníes",
}

interface IncomeModalProps {
  isOpen: boolean
  onClose: () => void
  currency: Currency | null
  onIncomeAdded: () => void
}

export function IncomeModal({ isOpen, onClose, currency, onIncomeAdded }: IncomeModalProps) {
  const handleIncomeAdded = () => {
    onIncomeAdded()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar Ingreso</DialogTitle>
          <DialogDescription>
            {currency
              ? `Registra un nuevo ingreso en ${CURRENCY_LABELS[currency]}`
              : "Registra un nuevo ingreso seleccionando la moneda"}
          </DialogDescription>
        </DialogHeader>

        <IncomeForm onIncomeAdded={handleIncomeAdded} preselectedCurrency={currency} showCurrencySelector={!currency} />
      </DialogContent>
    </Dialog>
  )
}
