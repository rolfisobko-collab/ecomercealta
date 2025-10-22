"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const ESTADOS = [
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En proceso" },
  { value: "ready", label: "Listo" },
  { value: "delivered", label: "Entregado" },
  { value: "cancelled", label: "Cancelado" },
] as const

type RequestItem = {
  id: string
  brandId: string
  modelId: string
  issueId: string
  selectedProductId: string | null
  logisticsType: string
  logisticsPrice: number
  servicePrice: number
  productPrice: number
  totalPrice: number
  status: string
  createdAt?: string
  contact?: { name?: string; phone?: string; address?: string } | null
}

export default function AdminSolicitudesPage() {
  const [items, setItems] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [services, setServices] = useState<any[]>([])
  const [brands, setBrands] = useState<any[]>([])
  const [models, setModels] = useState<any[]>([])
  const [estado, setEstado] = useState<string>("")
  const [detalle, setDetalle] = useState<RequestItem | null>(null)

  const load = async () => {
    setLoading(true)
    setError("")
    try {
      const [r1, r2, r3, r4] = await Promise.all([
        fetch("/api/service-requests", { cache: "no-store" }),
        fetch("/api/technical-services"),
        fetch("/api/service-brands"),
        fetch("/api/service-models"),
      ])
      if (!r1.ok) throw new Error(await r1.text())
      const data = await r1.json()
      setItems(Array.isArray(data) ? data.map((d: any) => ({ ...d, id: String(d.id ?? d._id ?? "") })) : [])
      setServices(await r2.json())
      setBrands(await r3.json())
      setModels(await r4.json())
    } catch (e: any) {
      setError(typeof e?.message === 'string' ? e.message : 'No se pudieron cargar las solicitudes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const itemsFiltrados = useMemo(() => {
    return items.filter(i => (estado ? i.status === estado : true))
  }, [items, estado])

  const updateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/service-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (!res.ok) throw new Error(await res.text())
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)))
    } catch (e) {
      // TODO: toast de error
    }
  }

  const nombreServicio = (id: string) => services.find((s: any) => s.id === id)?.name || id
  const nombreMarca = (id: string) => brands.find((b: any) => b.id === id)?.name || id
  const nombreModelo = (id: string) => models.find((m: any) => m.id === id)?.name || id

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Solicitudes de servicio</h1>
        <div className="flex items-center gap-2">
          <Select value={estado || "all"} onValueChange={(v) => setEstado(v === "all" ? "" : v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={load}>Actualizar</Button>
        </div>
      </div>

      {loading && <div className="py-12">Cargando…</div>}
      {error && <div className="py-2 text-red-600">{error}</div>}

      {!loading && itemsFiltrados.length === 0 && (
        <div className="py-12 text-gray-600">No hay solicitudes.</div>
      )}

      {!loading && itemsFiltrados.length > 0 && (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="py-2 px-3">Fecha</th>
                <th className="py-2 px-3">Servicio</th>
                <th className="py-2 px-3">Equipo</th>
                <th className="py-2 px-3">Costo logística</th>
                <th className="py-2 px-3">Total</th>
                <th className="py-2 px-3">Estado</th>
                <th className="py-2 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {itemsFiltrados.map((it) => (
                <tr key={it.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-3">{it.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}</td>
                  <td className="py-2 px-3">{nombreServicio(it.issueId)}</td>
                  <td className="py-2 px-3">{nombreMarca(it.brandId)} {nombreModelo(it.modelId)}</td>
                  <td className="py-2 px-3 font-semibold">${Number(it.logisticsPrice || 0).toFixed(2)}</td>
                  <td className="py-2 px-3 font-semibold">${Number(it.totalPrice || 0).toFixed(2)}</td>
                  <td className="py-2 px-3">
                    <span className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                      {ESTADOS.find((e) => e.value === it.status)?.label || it.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 space-y-2">
                    <Select onValueChange={(v) => updateStatus(it.id, v)}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Cambiar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {ESTADOS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => setDetalle(it)}>Ver detalles</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setDetalle(null)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-xl p-6" onClick={(e)=>e.stopPropagation()}>
            <h2 className="text-xl font-semibold mb-4">Detalle de la solicitud</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Fecha</div>
                <div>{detalle.createdAt ? new Date(detalle.createdAt).toLocaleString() : "-"}</div>
              </div>
              <div>
                <div className="text-gray-600">Estado</div>
                <div>{ESTADOS.find(e=>e.value===detalle.status)?.label || detalle.status}</div>
              </div>
              <div>
                <div className="text-gray-600">Servicio</div>
                <div>{nombreServicio(detalle.issueId)}</div>
              </div>
              <div>
                <div className="text-gray-600">Equipo</div>
                <div>{nombreMarca(detalle.brandId)} {nombreModelo(detalle.modelId)}</div>
              </div>
              <div>
                <div className="text-gray-600">Costo logística</div>
                <div>${Number(detalle.logisticsPrice||0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Dirección</div>
                <div>{detalle.contact?.address || "-"}</div>
              </div>
              <div>
                <div className="text-gray-600">Precio servicio</div>
                <div>${Number(detalle.servicePrice||0).toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Precio repuesto</div>
                <div>${Number(detalle.productPrice||0).toFixed(2)}</div>
              </div>
              <div className="sm:col-span-2">
                <div className="text-gray-600">Total</div>
                <div className="font-semibold">${Number(detalle.totalPrice||0).toFixed(2)}</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDetalle(null)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
