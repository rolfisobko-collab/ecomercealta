"use client"

import { useEffect, useMemo, useState } from "react"
import { collection, getDocs, query, doc, writeBatch, serverTimestamp, increment, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

interface ClientProfile {
  uid: string
  email: string
  displayName: string
  points: number
  createdAt?: any
  updatedAt?: any
  provider?: string
}

export default function ClientesAdminPage() {
  const [clients, setClients] = useState<ClientProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState("")
  const { toast } = useToast()
  const [pwOpen, setPwOpen] = useState(false)
  const [pw, setPw] = useState("")
  const [pending, setPending] = useState<null | { type: 'all' } | { type: 'one'; uid: string }>(null)
  const REQUIRED_PW = "Admin2686$"

  const load = async () => {
    try {
      setLoading(true)
      // Sin orderBy para evitar perder docs por índices o campos faltantes
      const snap = await getDocs(query(collection(db, "userProfiles")))
      const list: ClientProfile[] = snap.docs.map((d) => {
        const data: any = d.data()
        return {
          uid: d.id,
          email: String(data.email || ""),
          displayName: String(data.displayName || ""),
          points: Number(data.points || 0),
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          provider: data.provider || (data.email ? "password" : "unknown"),
        }
      })
      setClients(list)
    } catch (e) {
      console.error("load clients", e)
      toast({ title: "Error", description: "No se pudieron cargar los clientes", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return clients
    return clients.filter((c) => c.email.toLowerCase().includes(term) || c.displayName.toLowerCase().includes(term) || (c.provider || '').toLowerCase().includes(term))
  }, [q, clients])

  const formatTs = (ts: any) => {
    try {
      if (!ts) return "-"
      const d = typeof ts.toDate === "function" ? ts.toDate() : new Date(ts)
      return d.toLocaleString()
    } catch {
      return "-"
    }
  }

  const performGrantAll = async () => {
    try {
      if (clients.length === 0) return
      const batch = writeBatch(db as any)
      for (const c of clients) {
        const ref = doc(db as any, "userProfiles", c.uid)
        batch.update(ref, { points: increment(500), updatedAt: serverTimestamp() })
      }
      await batch.commit()
      toast({ title: "Puntos otorgados", description: `Se sumaron 500 puntos a ${clients.length} clientes` })
      await load()
    } catch (e) {
      console.error("grant all", e)
      toast({ title: "Error", description: "No se pudieron otorgar puntos", variant: "destructive" })
    }
  }

  const performGrantOne = async (uid: string) => {
    try {
      await updateDoc(doc(db as any, "userProfiles", uid), { points: increment(500), updatedAt: serverTimestamp() })
      toast({ title: "Puntos otorgados", description: `+500 puntos al cliente` })
      await load()
    } catch (e) {
      console.error("grant one", e)
      toast({ title: "Error", description: "No se pudieron otorgar puntos a este cliente", variant: "destructive" })
    }
  }

  const requestPasswordForAll = () => {
    setPending({ type: 'all' })
    setPw("")
    setPwOpen(true)
  }

  const requestPasswordForOne = (uid: string) => {
    setPending({ type: 'one', uid })
    setPw("")
    setPwOpen(true)
  }

  const confirmPwAndExecute = async () => {
    if (pw !== REQUIRED_PW) {
      toast({ title: 'Clave incorrecta', description: 'Ingresá la clave de administrador para continuar', variant: 'destructive' })
      return
    }
    const task = pending
    setPwOpen(false)
    setPending(null)
    if (!task) return
    if (task.type === 'all') {
      await performGrantAll()
    } else {
      await performGrantOne(task.uid)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clientes</h1>
          <p className="text-sm text-gray-600">Listado de cuentas de clientes (userProfiles)</p>
        </div>
        <div className="flex items-center gap-2">
          <Input placeholder="Buscar por email o nombre" value={q} onChange={(e) => setQ(e.target.value)} className="w-64" />
          <Button variant="outline" onClick={load} disabled={loading}>Actualizar</Button>
          <Button variant="outline" onClick={requestPasswordForAll} disabled={clients.length === 0 || loading}>
            +500 a todos
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Cargando clientes…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No hay clientes</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Puntos</TableHead>
                    <TableHead>Creado</TableHead>
                    <TableHead>Actualizado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.uid}>
                      <TableCell className="font-medium">{c.email}</TableCell>
                      <TableCell>{c.displayName || "-"}</TableCell>
                      <TableCell>{c.provider === 'password' ? 'Email/Contraseña' : c.provider ? c.provider.charAt(0).toUpperCase() + c.provider.slice(1) : '-'}</TableCell>
                      <TableCell>{c.points.toLocaleString()}</TableCell>
                      <TableCell>{formatTs(c.createdAt)}</TableCell>
                      <TableCell>{formatTs(c.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => requestPasswordForOne(c.uid)}>+500</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password modal */}
      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Ingresá la clave de administrador para otorgar puntos.</p>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Clave de administrador" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwOpen(false); setPending(null) }}>Cancelar</Button>
            <Button onClick={confirmPwAndExecute}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
