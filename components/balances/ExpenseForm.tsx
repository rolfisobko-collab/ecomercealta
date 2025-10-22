"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { cashRegisterService } from "@/services/api/cashRegisterService"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { Currency } from "@/models/Currency"

const EXPENSE_CATEGORIES = [
  { value: "almuerzo", label: "Almuerzo" },
  { value: "transporte", label: "Transporte" },
  { value: "sueldo", label: "Sueldo" },
  { value: "comision", label: "Comisión" },
  { value: "servicios", label: "Servicios (luz, agua, etc.)" },
  { value: "alquiler", label: "Alquiler" },
  { value: "materiales", label: "Materiales/Insumos" },
  { value: "marketing", label: "Marketing/Publicidad" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "otros", label: "Otros gastos" },
]

const CURRENCIES: { value: Currency; label: string }[] = [
  { value: "USD", label: "Dólares (Efectivo)" },
  { value: "USDT", label: "USDT" },
  { value: "PESO", label: "Pesos (Efectivo)" },
  { value: "PESO_TRANSFERENCIA", label: "Pesos (Transferencia)" },
  { value: "REAL", label: "Reales" },
  { value: "GUARANI", label: "Guaraníes" },
]

const expenseSchema = z.object({
  description: z.string().min(1, "La descripción es requerida"),
  amount: z.number().min(0.01, "El monto debe ser mayor a 0"),
  currency: z.enum(["USD", "USDT", "PESO", "PESO_TRANSFERENCIA", "REAL", "GUARANI"]),
  category: z.string().min(1, "La categoría es requerida"),
})

type ExpenseFormData = z.infer<typeof expenseSchema>

interface ExpenseFormProps {
  onExpenseAdded: () => void
  preselectedCurrency?: Currency | null
  showCurrencySelector?: boolean
}

export function ExpenseForm({ onExpenseAdded, preselectedCurrency, showCurrencySelector = true }: ExpenseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      description: "",
      amount: 0,
      currency: preselectedCurrency || "PESO",
      category: "",
    },
  })

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true)
    try {
      const result = await cashRegisterService.addExpense({
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        category: data.category,
        user: "Admin",
      })

      if (result) {
        toast({
          title: "Éxito",
          description: "Egreso registrado correctamente",
        })
        form.reset({
          description: "",
          amount: 0,
          currency: preselectedCurrency || "PESO",
          category: "",
        })
        onExpenseAdded()
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar el egreso",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe el gasto..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    onChange={(e) => field.onChange(Number.parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {showCurrencySelector && (
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CURRENCIES.map((currency) => (
                        <SelectItem key={currency.value} value={currency.value}>
                          {currency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Registrando...
            </>
          ) : (
            "Registrar Egreso"
          )}
        </Button>
      </form>
    </Form>
  )
}
