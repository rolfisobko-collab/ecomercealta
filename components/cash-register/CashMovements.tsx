"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ArrowLeftRight, Plus, Minus } from "lucide-react"
import type { Currency, Transaction } from "./types"
import { formatCurrency } from "./currency-utils"

export function CashMovements() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [type, setType] = useState<"ingreso" | "egreso">("ingreso")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState<Currency>("PESO")
  const [description, setDescription] = useState("")

  const addTransaction = () => {
    if (!amount || Number.parseFloat(amount) <= 0 || !description) return

    const newTransaction: Transaction = {
      id: Date.now().toString(),
      type,
      amount: Number.parseFloat(amount),
      currency,
      description,
      timestamp: new Date(),
    }

    setTransactions([newTransaction, ...transactions])
    setAmount("")
    setDescription("")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Movimientos de Caja
        </CardTitle>
        <CardDescription>Registre ingresos y egresos de dinero</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="movement-type">Tipo</Label>
              <Select value={type} onValueChange={(value) => setType(value as "ingreso" | "egreso")}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="movement-amount">Monto</Label>
              <Input
                id="movement-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
              />
            </div>
            <div>
              <Label htmlFor="movement-currency">Moneda</Label>
              <Select value={currency} onValueChange={(value) => setCurrency(value as Currency)}>
                <SelectTrigger>
                  <SelectValue placeholder="Moneda" />
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
            <div className="md:col-span-4">
              <Label htmlFor="movement-description">Descripción</Label>
              <Input
                id="movement-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Motivo del movimiento"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={addTransaction}>
              {type === "ingreso" ? <Plus className="mr-2 h-4 w-4" /> : <Minus className="mr-2 h-4 w-4" />}
              Registrar {type === "ingreso" ? "Ingreso" : "Egreso"}
            </Button>
          </div>

          {transactions.length > 0 && (
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Descripción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 5).map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{transaction.timestamp.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === "ingreso" ? "success" : "destructive"}>
                          {transaction.type === "ingreso" ? "Ingreso" : "Egreso"}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(transaction.amount, transaction.currency)}</TableCell>
                      <TableCell>{transaction.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {transactions.length > 5 && (
                <div className="mt-2 text-center">
                  <Button variant="link">Ver todos los movimientos</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
