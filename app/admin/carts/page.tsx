"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { ShoppingCart, RefreshCw } from "lucide-react"

interface CartItemRow {
  id: string
  name: string
  price: number
  quantity: number
  subtotal: number
}

interface PosCartDoc {
  id: string
  items: CartItemRow[]
  subtotal: number
  total: number
  paymentMethod?: string
  status: "open" | "completed" | string
  createdAt?: any
  updatedAt?: any
  completedAt?: any
  saleId?: string
}

export default function AdminCartsPage() {
  const [carts, setCarts] = useState<PosCartDoc[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [detail, setDetail] = useState<PosCartDoc | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "pos_carts"), orderBy("updatedAt", "desc"))
    const unsub = onSnapshot(q, (snap) => {
      const list: PosCartDoc[] = []
      snap.forEach((doc) => {
        const d = doc.data() as any
        list.push({ id: doc.id, ...d })
      })
      setCarts(list)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const filtered = useMemo(() => {
    return carts.filter((c) => {
      const matchesStatus = statusFilter === "all" || c.status === statusFilter
      const s = search.trim().toLowerCase()
      const matchesSearch = s === "" || c.items?.some((it) => it.name?.toLowerCase().includes(s))
      return matchesStatus && matchesSearch
    })
  }, [carts, search, statusFilter])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-5 w-5"/> Carritos (POS)</h1>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="open">Abiertos</SelectItem>
              <SelectItem value="completed">Completados</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Input
              placeholder="Buscar por producto en el carrito..."
              value={search}
              onChange={(e)=>setSearch(e.target.value)}
              className="pr-10"
            />
            <RefreshCw className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de carritos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 text-center text-gray-500">Cargando…</div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No hay carritos para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left border-b bg-gray-50 dark:bg-gray-800">
                    <th className="py-2 px-3">Actualizado</th>
                    <th className="py-2 px-3">Estado</th>
                    <th className="py-2 px-3">Items</th>
                    <th className="py-2 px-3">Subtotal</th>
                    <th className="py-2 px-3">Total</th>
                    <th className="py-2 px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c)=> (
                    <tr key={c.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-2 px-3">{c.updatedAt?.toDate ? new Date(c.updatedAt.toDate()).toLocaleString() : '-'}</td>
                      <td className="py-2 px-3">
                        <span className="inline-flex items-center rounded bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs text-gray-700 dark:text-gray-300">
                          {c.status === 'open' ? 'Abierto' : c.status === 'completed' ? 'Completado' : c.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">{c.items?.length || 0}</td>
                      <td className="py-2 px-3">${Number(c.subtotal||0).toFixed(2)}</td>
                      <td className="py-2 px-3">${Number(c.total||0).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <Button variant="outline" size="sm" onClick={()=>setDetail(c)}>Ver detalle</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detail} onOpenChange={(open)=>!open && setDetail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle del carrito</DialogTitle>
            <DialogDescription>
              {detail?.status === 'open' ? 'Carrito abierto' : 'Carrito completado'}
              {detail?.saleId ? ` • Venta: ${detail.saleId}` : ''}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-600">Actualizado</div>
                  <div>{detail.updatedAt?.toDate ? new Date(detail.updatedAt.toDate()).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-600">Creado</div>
                  <div>{detail.createdAt?.toDate ? new Date(detail.createdAt.toDate()).toLocaleString() : '-'}</div>
                </div>
                <div>
                  <div className="text-gray-600">Subtotal</div>
                  <div>${Number(detail.subtotal||0).toFixed(2)}</div>
                </div>
                <div>
                  <div className="text-gray-600">Total</div>
                  <div>${Number(detail.total||0).toFixed(2)}</div>
                </div>
              </div>
              <Separator />
              <div>
                <div className="font-medium mb-2">Items</div>
                <div className="space-y-2">
                  {detail.items?.map((it)=> (
                    <div key={it.id} className="flex items-center justify-between text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{it.name}</div>
                        <div className="text-gray-500">{it.quantity} x ${Number(it.price||0).toFixed(2)}</div>
                      </div>
                      <div className="font-semibold">${Number(it.subtotal||0).toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
