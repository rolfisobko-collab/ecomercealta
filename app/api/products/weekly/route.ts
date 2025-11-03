import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getRedis } from "@/lib/redis"

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 60, 1000)

    const redis = getRedis()
    const ver = redis ? String((await redis.get('products:ver')) ?? '0') : '0'
    const cacheKey = redis ? `products:v${ver}:weekly:limit=${limit}` : null

    if (redis && cacheKey) {
      const hit = await redis.get<string>(cacheKey)
      if (hit) return NextResponse.json(JSON.parse(hit))
    }

    const projection = {
      _id: 1,
      name: 1,
      price: 1,
      images: 1,
      image1: 1,
      weeklyOffer: 1,
      updatedAt: 1,
    }

    const truthy = [true, "true", 1, "1", "yes", "on"]
    const filter = { weeklyOffer: { $in: truthy as any[] } }

    const collections = ['stock','products','inventory','inventario','productos','items']
    const seen = new Set<string>()
    const out: any[] = []

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

    return NextResponse.json(out)
  } catch (error) {
    console.error("/api/products/weekly GET error:", error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: "Internal Server Error", error: message }, { status: 500 })
  }
}
