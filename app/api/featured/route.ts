import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getRedis } from "@/lib/redis"

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 24, 2000)

    const redis = getRedis()
    const ver = redis ? String((await redis.get('products:ver')) ?? '0') : '0'
    const keyL = redis ? `featured:v${ver}:liquidation:list:${limit}` : null
    const keyW = redis ? `featured:v${ver}:weekly:list:${limit}` : null
    const keyLPersist = 'featured:liquidation:list'
    const keyWPersist = 'featured:weekly:list'

    const isValid = (p: any) => {
      if (!p) return false
      const name = String(p.name || '').trim()
      const price = Number(p.price || 0)
      return !!name && price > 0
    }

    // Try persistent precomputed lists first (instant, write-through on updates)
    if (redis) {
      const [lPersist, wPersist] = await Promise.all([
        redis.get<string>(keyLPersist),
        redis.get<string>(keyWPersist),
      ])
      if (lPersist || wPersist) {
        const lRaw = lPersist ? JSON.parse(lPersist) : []
        const wRaw = wPersist ? JSON.parse(wPersist) : []
        const l = Array.isArray(lRaw) ? lRaw.filter(isValid).slice(0, limit) : []
        const w = Array.isArray(wRaw) ? wRaw.filter(isValid).slice(0, limit) : []
        // Self-heal persisted keys with filtered content
        await Promise.all([
          redis.set(keyLPersist, JSON.stringify(l)),
          redis.set(keyWPersist, JSON.stringify(w)),
        ])
        if (l.length || w.length) {
          return NextResponse.json(
            { liquidation: l, weekly: w },
            { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' } }
          )
        }
      }
    }

    // Try compact Mongo featured collections (fast, small)
    try {
      const [lDocs, wDocs] = await Promise.all([
        db.collection('featured_liquidation').find({}, { projection: { _id: 1, name: 1, price: 1, image1: 1, images: 1, updatedAt: 1 } }).sort({ updatedAt: -1, name: 1 }).limit(limit).toArray(),
        db.collection('featured_weekly').find({}, { projection: { _id: 1, name: 1, price: 1, image1: 1, images: 1, updatedAt: 1 } }).sort({ updatedAt: -1, name: 1 }).limit(limit).toArray(),
      ])
      const outL = (lDocs || []).map(d => ({ id: String(d._id), ...d })).filter(isValid)
      const outW = (wDocs || []).map(d => ({ id: String(d._id), ...d })).filter(isValid)
      if (outL.length > 0 || outW.length > 0) {
        if (redis) {
          await Promise.all([
            redis.set(keyLPersist, JSON.stringify(outL)),
            redis.set(keyWPersist, JSON.stringify(outW)),
          ])
        }
        return NextResponse.json(
          { liquidation: outL, weekly: outW },
          { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' } }
        )
      }
    } catch {}

    // Try versioned keys (ISR-like caching)
    if (redis && keyL && keyW) {
      const [lHit, wHit] = await Promise.all([
        redis.get<string>(keyL),
        redis.get<string>(keyW),
      ])
      if (lHit && wHit) {
        const l = JSON.parse(lHit)
        const w = JSON.parse(wHit)
        const lf = Array.isArray(l) ? l.filter(isValid) : []
        const wf = Array.isArray(w) ? w.filter(isValid) : []
        if (redis) {
          await Promise.all([
            redis.set(keyL, JSON.stringify(lf), { ex: 60 }),
            redis.set(keyW, JSON.stringify(wf), { ex: 60 }),
          ])
        }
        return NextResponse.json(
          { liquidation: lf, weekly: wf },
          { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' } }
        )
      }
    }

    // Minimal projection
    const projection = {
      _id: 1,
      name: 1,
      price: 1,
      images: 1,
      image1: 1,
      liquidation: 1,
      weeklyOffer: 1,
      updatedAt: 1,
    } as const

    const truthy = [true, "true", 1, "1", "yes", "on"] as any[]
    const filterL: any = { liquidation: { $in: truthy } }
    const filterW: any = { weeklyOffer: { $in: truthy } }

    const collections = ['stock','products','inventory','inventario','productos','items']

    const seenL = new Set<string>()
    const outL: any[] = []
    const seenW = new Set<string>()
    const outW: any[] = []

    for (let i = 0; i < collections.length && (outL.length < limit || outW.length < limit); i++) {
      const colName = collections[i]
      try {
        const [lDocs, wDocs] = await Promise.all([
          db.collection(colName).find(filterL, { projection }).sort({ updatedAt: -1, name: 1 }).limit(limit).toArray(),
          db.collection(colName).find(filterW, { projection }).sort({ updatedAt: -1, name: 1 }).limit(limit).toArray(),
        ])
        for (const d of lDocs) {
          if (outL.length >= limit) break
          const id = String(d._id)
          if (seenL.has(id)) continue
          seenL.add(id)
          const rec = { id, ...d }
          if (isValid(rec)) outL.push(rec)
        }
        for (const d of wDocs) {
          if (outW.length >= limit) break
          const id = String(d._id)
          if (seenW.has(id)) continue
          seenW.add(id)
          const rec = { id, ...d }
          if (isValid(rec)) outW.push(rec)
        }
      } catch {}
    }

    if (redis) {
      // Update versioned keys (short TTL)
      if (keyL && keyW) {
        await Promise.all([
          redis.set(keyL, JSON.stringify(outL), { ex: 60 }),
          redis.set(keyW, JSON.stringify(outW), { ex: 60 }),
        ])
      }
      // Update persistent precomputed lists for instant reads on next request
      await Promise.all([
        redis.set(keyLPersist, JSON.stringify(outL)),
        redis.set(keyWPersist, JSON.stringify(outW)),
      ])
    }

    return NextResponse.json(
      { liquidation: outL, weekly: outW },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' } }
    )
  } catch (error) {
    console.error('/api/featured GET error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 })
  }
}
