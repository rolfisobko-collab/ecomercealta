"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Sword, Shield, Star, Crown, ArrowLeft } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, addDoc, serverTimestamp } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { productService } from "@/services/hybrid/productService"
import { onProductsUpdate } from "@/services/hybrid/productService"

export default function GremioPerfilPage() {
  const auth = useAuth()
  const router = useRouter()
  const [points, setPoints] = useState<number>(0)
  const [level, setLevel] = useState<number>(1)
  const [rank, setRank] = useState<string>("Aprendiz")
  const [rewards, setRewards] = useState<any[]>([])
  const [claiming, setClaiming] = useState<string | null>(null)
  const [moduleCount, setModuleCount] = useState<number>(0)
  const [promoClaimed, setPromoClaimed] = useState<boolean>(false)
  // WoW-like XP curve helpers
  const xpForLevel = (lvl: number) => {
    // Non-linear growth per level
    // Tuned for app scale: early levels fast, later levels steeper
    return Math.floor(100 + lvl * 50 + Math.pow(lvl, 2) * 10)
  }
  const totalXpForLevel = (lvl: number) => {
    // Total XP required to reach the start of level `lvl`
    let sum = 0
    for (let i = 1; i < lvl; i++) sum += xpForLevel(i)
    return sum
  }
  const { currentLevel, currentStart, nextStart } = useMemo(() => {
    let lvl = 1
    // Cap to avoid infinite loop in extreme cases
    while (lvl < 200 && points >= totalXpForLevel(lvl + 1)) lvl++
    return { currentLevel: lvl, currentStart: totalXpForLevel(lvl), nextStart: totalXpForLevel(lvl + 1) }
  }, [points])
  const nextLevelPoints = Math.max(0, nextStart - currentStart)
  const progressPct = Math.min(100, Math.max(0, Math.round(((points - currentStart) / Math.max(1, nextLevelPoints)) * 100)))

  const achievements = [
    { id: "a1", name: "Primer Pedido", desc: "Realizaste tu primer compra en el Gremio", icon: <Trophy className="h-5 w-5 text-yellow-500" />, earned: true },
    { id: "a2", name: "Combo Maestro", desc: "Compraste 5 productos en una sola orden", icon: <Sword className="h-5 w-5 text-red-500" />, earned: true },
    { id: "a3", name: "Cliente Fiel", desc: "10 pedidos completados", icon: <Star className="h-5 w-5 text-amber-400" />, earned: true },
    { id: "a4", name: "Guardián del Stock", desc: "Reportaste 3 productos sin stock", icon: <Shield className="h-5 w-5 text-blue-500" />, earned: false },
  ]

  useEffect(() => {
    // Map level ranges to rank labels (flavor only)
    const lvl = currentLevel
    const r = lvl >= 60 ? "Gran Maestro" : lvl >= 40 ? "Maestro" : lvl >= 20 ? "Experto" : lvl >= 10 ? "Artesano" : "Aprendiz"
    setRank(r)
    setLevel(lvl)
  }, [currentLevel])

  // Cargar puntos desde órdenes reales del usuario
  useEffect(() => {
    // Esperar a que AuthContext termine de inicializar
    if (auth.loading) return
    if (!auth.user) {
      router.replace("/auth/login?redirect=/gremio/perfil")
      return
    }
    const loadUserPoints = async () => {
      try {
        const uid = auth.user?.uid
        if (!uid) return
        const ordersRef = collection(db, "orders")
        const q = query(ordersRef, where("userId", "==", uid))
        const snap = await getDocs(q)
        const items: { productId?: string; quantity: number; price?: number }[] = []
        snap.forEach((doc) => {
          const data: any = doc.data()
          const status = String(data.status || '').toLowerCase()
          const paymentStatus = String(data.paymentStatus || '').toLowerCase()
          const isPaid = paymentStatus === 'paid' || ['completed','delivered','shipped'].includes(status)
          if (!isPaid) return
          const orderItems: any[] = data.items || []
          orderItems.forEach((it) => items.push({ productId: it.productId, quantity: it.quantity || 1, price: it.price }))
        })

        const ids = Array.from(new Set(items.map((i) => i.productId).filter(Boolean))) as string[]
        const productsMap = new Map<string, any>()
        await Promise.all(
          ids.map(async (id) => {
            const p = await productService.getById(id)
            if (p) productsMap.set(id, p)
          }),
        )

        let total = 0
        let modules = 0
        for (const it of items) {
          const p = it.productId ? productsMap.get(it.productId) : null
          const unitPoints = p?.points ?? Math.max(0, Math.round(((p?.price || it.price || 0)) * 100))
          total += unitPoints * (it.quantity || 1)
          const catRaw = String(p?.categoryName || p?.category || "").toLowerCase()
          const nameRaw = String(p?.name || "").toLowerCase()
          const isModule = /(m[oó]dulo|modulo)/i.test(catRaw) || /(m[oó]dulo|modulo)/i.test(nameRaw)
          if (isModule) modules += (it.quantity || 1)
        }
        setPoints(total)
        setModuleCount(modules)
      } catch (e) {
        console.error("Error cargando puntos de usuario:", e)
      }
    }
    loadUserPoints()
  }, [auth.user?.uid, auth.loading])

  useEffect(() => {
    let unsub: (() => void) | null = null
    const prime = async () => {
      const all = await productService.getAll()
      setRewards((all || []).filter((p: any) => Boolean((p as any).isReward)))
    }
    prime()
    try {
      const stop = (onProductsUpdate as any)((products: any[]) => {
        setRewards((products || []).filter((p: any) => Boolean((p as any).isReward)))
      })
      if (typeof stop === 'function') unsub = stop
    } catch {}
    return () => { try { unsub && unsub() } catch {} }
  }, [])

  // Check if toolkit promo already claimed
  useEffect(() => {
    const checkClaim = async () => {
      try {
        if (!auth.user?.uid) return
        const claimsRef = collection(db, "rewardClaims")
        const qy = query(claimsRef, where("userId", "==", auth.user.uid), where("type", "==", "toolkit_promo"))
        const res = await getDocs(qy)
        setPromoClaimed(!res.empty)
      } catch {}
    }
    checkClaim()
  }, [auth.user?.uid])

  const claimReward = async (productId: string, needed: number) => {
    if (!auth.user?.uid) return
    if (points < needed) return
    try {
      setClaiming(productId)
      await addDoc(collection(db, "rewardClaims"), {
        userId: auth.user.uid,
        productId,
        pointsRequired: needed,
        createdAt: serverTimestamp(),
        status: "pending",
      })
    } finally {
      setClaiming(null)
    }
  }

  return (
    <div className="container mx-auto px-3 md:px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Crown className="h-6 w-6 text-red-600" />
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Perfil del Gremio</h1>
        </div>
        <Button asChild variant="outline" size="sm" className="md:size-default">
          <Link href="/gremio" className="inline-flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-gradient-to-b from-red-50/60 to-white dark:from-gray-800 dark:to-gray-900 border border-red-100/60 dark:border-gray-800">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 md:h-16 md:w-16 ring-2 ring-red-500/60">
                <AvatarImage src={auth.user?.photoURL || "/avatar.png"} alt={auth.user?.displayName || "Usuario"} />
                <AvatarFallback>{(auth.user?.displayName || "UG").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-lg md:text-xl truncate">{auth.user?.displayName || "Mi perfil del Gremio"}</CardTitle>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" className="rounded-full">Rango: {rank}</Badge>
                  <Badge className="rounded-full bg-red-600 text-white">Nivel {level}</Badge>
                  <Badge variant="outline" className="rounded-full">{points} pts</Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2 text-sm">
                <span>Progreso al siguiente nivel</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} className="h-3" />
              <div className="mt-1 text-xs text-gray-500">Objetivo: {nextLevelPoints} pts</div>
            </div>
            <div className="mt-2 text-xs text-gray-500">XP para el siguiente nivel: {Math.max(0, nextStart - points)} pts</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">¡Recompensas!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {(() => {
              const now = new Date()
              const year = now.getFullYear()
              const promoEnd = new Date(year, 10, 30, 23, 59, 59) // Mes 10 = Noviembre (0-index)
              const expired = now > promoEnd
              const goal = 40
              const progress = Math.min(goal, moduleCount)
              const pct = Math.round((progress / goal) * 100)
              const canClaim = !expired && progress >= goal && !promoClaimed
              const imgUrl = "https://http2.mlstatic.com/D_NQ_NP_962137-MLA73204395301_122023-O.webp"
              const msLeft = Math.max(0, promoEnd.getTime() - now.getTime())
              const days = Math.floor(msLeft / (1000*60*60*24))
              const hours = Math.floor((msLeft % (1000*60*60*24)) / (1000*60*60))
              return (
                <div className={`group p-4 rounded-2xl border shadow-sm ${canClaim ? 'border-emerald-300 bg-emerald-50/70 dark:bg-emerald-900/20' : 'border-red-200/60 bg-gradient-to-br from-white/80 to-red-50/60 dark:from-gray-900/60 dark:to-red-950/10'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-red-600 text-white shadow-sm">¡Promo Noviembre!</span>
                    <span className={`text-[11px] ${expired ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-gray-300'}`}>
                      {expired ? 'Finalizada' : `Termina en ${days}d ${hours}h`}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-40 w-full sm:h-56 sm:w-[620px] max-w-full rounded-2xl overflow-hidden bg-white flex items-center justify-center ring-1 ring-black/5 shadow-sm">
                      <img src={imgUrl} alt="Kit de herramientas 6 en 1" className="h-full w-full object-contain transition-transform duration-300 ease-out group-hover:scale-105" />
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-extrabold tracking-tight">¡Ganá un Kit de Herramientas (6 en 1)!</div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Comprá 40 módulos (pantallas) antes del 30/11</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium">{progress}/{goal} módulos</span>
                      <span className="font-medium">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className={`text-xs ${expired ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'}`}>
                      {expired ? 'Promoción finalizada' : `Válida hasta el ${promoEnd.toLocaleDateString('es-AR')}`}
                    </div>
                    <Button
                      size="sm"
                      disabled={!canClaim}
                      className={`${canClaim ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700 disabled:opacity-50'}`}
                      onClick={async () => {
                        try {
                          if (!auth.user?.uid) return
                          if (!canClaim) return
                          await addDoc(collection(db, 'rewardClaims'), {
                            userId: auth.user.uid,
                            type: 'toolkit_promo',
                            modulesRequired: goal,
                            modulesCount: moduleCount,
                            createdAt: serverTimestamp(),
                            status: 'pending',
                          })
                          setPromoClaimed(true)
                        } catch {}
                      }}
                    >
                      {promoClaimed ? 'Solicitud enviada' : (canClaim ? '¡Canjear kit!' : 'Seguí sumando')}
                    </Button>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <CardTitle>Premios disponibles</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay premios por ahora.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((r: any) => {
                const earn = Number((r as any).points ?? Math.round((Number(r.price||0))*100))
                const req = Number((r as any).redeemPoints ?? earn * 9)
                const canClaim = points >= req
                return (
                  <div key={r.id} className="border rounded-lg p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                        {(r.image1 || (r.images||[])[0]) ? (
                          <img src={r.image1 || (r.images||[])[0]} alt={r.name} className="object-cover w-full h-full" />
                        ) : (
                          <Star className="h-5 w-5 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.name}</div>
                        <div className="text-xs text-muted-foreground">Requiere {req.toLocaleString('es-AR')} pts</div>
                      </div>
                    </div>
                    <Button
                      disabled={!canClaim || claiming === r.id}
                      onClick={() => claimReward(r.id, req)}
                      className="w-full bg-red-600 hover:bg-red-700"
                    >
                      {claiming === r.id ? 'Reclamando...' : (canClaim ? 'Reclamar recompensa' : 'Insuficientes puntos')}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rangos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { name: 'Aprendiz', minLevel: 1 },
            { name: 'Artesano', minLevel: 10 },
            { name: 'Experto', minLevel: 20 },
            { name: 'Maestro', minLevel: 40 },
            { name: 'Gran Maestro', minLevel: 60 },
          ].map((r) => {
            const achieved = level >= r.minLevel
            const current = rank === r.name
            return (
              <div key={r.name} className={`flex items-center justify-between rounded-lg border px-3 py-2 ${current ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' : 'bg-white/70 dark:bg-gray-900/50'}`}>
                <div className="flex items-center gap-2">
                  <Badge className={`${current ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200'}`}>{r.name}</Badge>
                  <span className="text-xs text-gray-500">Nivel {r.minLevel}+</span>
                </div>
                <div className={`text-xs font-medium ${achieved ? 'text-green-600' : 'text-gray-400'}`}>{achieved ? 'Alcanzado' : 'Bloqueado'}</div>
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
