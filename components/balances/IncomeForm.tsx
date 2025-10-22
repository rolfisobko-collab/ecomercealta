"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { cashRegisterService } from "@/services/api/cashRegisterService"
import type { Currency } from "@/models/Currency"

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: "USD", label: "Dólares (Efectivo)" },
  { value: "USDT", label: "USDT" },
  { value: "PESO", label: "Pesos (Efectivo)" },
  { value: "PESO_TRANSFERENCIA", label: "Pesos (Transferencia)" },
  { value: "REAL", label: "Reales" },
  { value: "GUARANI", label: "Guaraníes" },
]

const INCOME_CATEGORIES = [
  "Venta de productos",
  "Servicios técnicos",
  "Reparaciones",
  "Accesorios",
  "Consultoría",
  "Capacitación",
  "Comisiones",
  "Intereses",
  "Devolución de préstamo",
  "Venta de equipos usados",
  "Otros ingresos",
]

interface IncomeFormProps {
  onIncomeAdded: () => void
  preselectedCurrency?: Currency | null
  showCurrencySelector?: boolean
}

export function IncomeForm({ onIncomeAdded, preselectedCurrency, showCurrencySelector = true }: IncomeFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    currency: preselectedCurrency || ("PESO" as Currency),
    category: "",
  })

  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.description.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa una descripción del ingreso",
        variant: "destructive",
      })
      return
    }

    if (!formData.amount || Number.parseFloat(formData.amount) <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingresa un monto válido mayor a 0",
        variant: "destructive",
      })
      return
    }

    if (!formData.category) {
      toast({
        title: "Error",
        description: "Por favor selecciona una categoría",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      const income = await cashRegisterService.addIncome({
        description: formData.description.trim(),
        amount: Number.parseFloat(formData.amount),
        currency: formData.currency,
        category: formData.category,
        user: "Admin", // Esto debería venir del contexto de autenticación
      })

      if (income) {
        toast({
          title: "Ingreso registrado",
          description: `Se registró un ingreso de ${formData.amount} ${formData.currency}`,
        })

        // Limpiar formulario
        setFormData({
          description: "",
          amount: "",
          currency: preselectedCurrency || ("PESO" as Currency),
          category: "",
        })

        onIncomeAdded()
      } else {
        throw new Error("No se pudo registrar el ingreso")
      }
    } catch (error) {
      console.error("Error registrando ingreso:", error)
      toast({
        title: "Error",
        description: "No se pudo registrar el ingreso. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="description">Descripción del Ingreso *</Label>
        <Textarea
          id="description"
          placeholder="Ej: Venta de productos, servicios técnicos, etc."
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="amount">Monto *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          />
        </div>

        {showCurrencySelector && (
          <div className="space-y-2">
            <Label htmlFor="currency">Moneda *</Label>
            <Select
              value={formData.currency}
              onValueChange={(value: Currency) => setFormData({ ...formData, currency: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                {CURRENCY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoría *</Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar categoría" />
          </SelectTrigger>
          <SelectContent>
            {INCOME_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
          {isLoading ? "Registrando..." : "Registrar Ingreso"}
        </Button>
      </div>
    </form>
  )
}
