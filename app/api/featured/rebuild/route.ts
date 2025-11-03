import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getRedis } from "@/lib/redis"

export const runtime = 'nodejs'

export async function POST() {
  try {
    const { db } = await connectToDatabase()
    const redis = getRedis()
    const keyLPersist = 'featured:liquidation:list'
    const keyWPersist = 'featured:weekly:list'

    const [lDocs, wDocs] = await Promise.all([
      db.collection('featured_liquidation').find({}, { projection: { _id: 1, name: 1, price: 1, image1: 1, images: 1, updatedAt: 1 } }).sort({ updatedAt: -1, name: 1 }).limit(200).toArray(),
      db.collection('featured_weekly').find({}, { projection: { _id: 1, name: 1, price: 1, image1: 1, images: 1, updatedAt: 1 } }).sort({ updatedAt: -1, name: 1 }).limit(200).toArray(),
    ])

    const outL = (lDocs || []).map(d => ({ id: String(d._id), ...d }))
    const outW = (wDocs || []).map(d => ({ id: String(d._id), ...d }))

    if (redis) {
      await Promise.all([
        redis.set(keyLPersist, JSON.stringify(outL)),
        redis.set(keyWPersist, JSON.stringify(outW)),
        redis.incr('products:ver'),
      ])
    }

    return NextResponse.json({ success: true, liquidation: outL.length, weekly: outW.length })
  } catch (error) {
    console.error('/api/featured/rebuild POST error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 })
  }
}
