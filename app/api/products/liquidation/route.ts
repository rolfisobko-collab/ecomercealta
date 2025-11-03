import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getRedis } from "@/lib/redis"

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 200, 2000)

    // Redis: versioned cache key aligns with global products version
    const redis = getRedis()
    const ver = redis ? String((await redis.get('products:ver')) ?? '0') : '0'
    const cacheKey = redis ? `products:v${ver}:liquidation:limit=${limit}` : null

    if (redis && cacheKey) {
      const hit = await redis.get<string>(cacheKey)
      if (hit) return NextResponse.json(JSON.parse(hit), { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' } })
    }

    const projection = {
      _id: 1,
      name: 1,
      price: 1,
      images: 1,
      image1: 1,
      liquidation: 1,
      updatedAt: 1,
    }

    const collections = ['stock','products','inventory','inventario','productos','items']
    const seen = new Set<string>()
    const out: any[] = []

    const truthy = [true, "true", 1, "1", "yes", "on"]
    const filter: any = { liquidation: { $in: truthy as any[] } }

    for (let i = 0; i < collections.length && out.length < limit; i++) {
      const colName = collections[i]
      try {
        const cursor = db.collection(colName)
          .find(filter as any, { projection })
          .sort({ updatedAt: -1, name: 1 })
          .limit(limit)
        const docs = await cursor.toArray()
        for (const d of docs) {
          const key = String(d._id)
          if (seen.has(key)) continue
          seen.add(key)
          out.push({ ...d, id: key })
          if (out.length >= limit) break
        }
      } catch {}
    }

    if (redis && cacheKey) {
      await redis.set(cacheKey, JSON.stringify(out), { ex: 60 })
    }

    return NextResponse.json(out, { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=600' } })
  } catch (error) {
    console.error("/api/products/liquidation GET error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 })
  }
}
