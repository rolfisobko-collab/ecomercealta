"use client"

import { useEffect, useMemo, useState, Suspense } from "react"
import type { Order } from "@/services/api/orderService"
import { getOrders } from "@/services/api/orderService"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Package, CalendarDays, User2, Receipt, ChevronRight } from "lucide-react"

const STATUS_PILLS = [
  { value: "", label: "Todos" },
  { value: "Pendiente", label: "Pendiente" },
  { value: "Procesando", label: "Procesando" },
  { value: "Enviado", label: "Enviado" },
  { value: "Entregado", label: "Entregado" },
  { value: "Cancelado", label: "Cancelado" },
]

function normalizeStatusToEs(status?: string): string {
  if (!status) return "-"
  const s = status.toLowerCase()
  if (s.includes("pend")) return "Pendiente"
  if (s.includes("process") || s.includes("proc")) return "Procesando"
  if (s.includes("ship") || s.includes("env")) return "Enviado"
  if (s.includes("deliver") || s.includes("entreg")) return "Entregado"
  if (s.includes("cancel")) return "Cancelado"
  // fallback: capitalize first letter
  return status.charAt(0).toUpperCase() + status.slice(1)
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "Pendiente":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
    case "Procesando":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
    case "Enviado":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
    case "Entregado":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    case "Cancelado":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }
}

function friendlyOrderNumber(id?: string): string {
  if (!id) return "-"
  const chunk = id.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase()
  return `Pedido #${chunk}`
}

export const dynamic = 'force-dynamic'

export default function GremioOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        setLoading(true)
        const data = await getOrders()
        if (active) setOrders(data)
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const filtered = useMemo(() => {
    let list = orders
    if (status) {
      list = list.filter((o) => normalizeStatusToEs(o.status) === status)
    }
    if (q.trim()) {
      const term = q.toLowerCase()
      list = list.filter((o) =>
        [friendlyOrderNumber(o.id), o.customer, normalizeStatusToEs(o.status), String(o.total)]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term))
      )
    }
    return list
  }, [orders, q, status])

  return (
    <Suspense fallback={<div className="text-sm text-gray-500 p-4">Cargando pedidos...</div>}>
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-red-600" />
          <h1 className="text-xl font-semibold tracking-tight">Mis pedidos</h1>
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">Historial y estado de tus compras</div>
      </div>

      <div className="rounded-lg border bg-white dark:bg-gray-900 p-3 md:p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1">
            <Input
              placeholder="Buscar por cliente, número de pedido o total"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_PILLS.map((opt) => (
              <Button
                key={opt.value}
                size="sm"
                variant={status === opt.value ? "default" : "outline"}
                onClick={() => setStatus(opt.value)}
              >
                {opt.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={() => { setQ(""); setStatus("") }}>Limpiar</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-gray-500">Cargando pedidos...</div>
      ) : (
        <div className="w-full overflow-x-auto rounded-lg border bg-white dark:bg-gray-900 shadow-sm">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-4">Pedido</th>
                <th className="py-2 pr-4">Cliente</th>
                <th className="py-2 pr-4">Fecha</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4">Total</th>
                <th className="py-2 pr-4">Items</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const es = normalizeStatusToEs(o.status)
                return (
                  <tr key={o.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <Link href={`/order-confirmation/${o.id}`} className="inline-flex items-center gap-2 text-red-600 hover:underline">
                        <Receipt className="h-4 w-4" />
                        {friendlyOrderNumber(o.id)}
                      </Link>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="inline-flex items-center gap-2">
                        <User2 className="h-4 w-4 text-gray-400" />
                        <span>{o.customer || "-"}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-400" />
                        <span>{o.date || o.createdAt?.toLocaleDateString?.() || "-"}</span>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <Badge className={statusBadgeClass(es)}>{es}</Badge>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">{o.total?.toLocaleString?.("es-AR") || o.total}</td>
                    <td className="py-2 pr-4">
                      <Badge variant="secondary">{o.items?.length ?? 0}</Badge>
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <Link href={`/order-confirmation/${o.id}`} className="inline-flex items-center text-xs text-gray-500 hover:text-red-600">
                        Ver detalle
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-sm text-gray-500 p-4">No hay pedidos con esos filtros.</div>
          )}
        </div>
      )}
    </div>
    </Suspense>
  )
}
