import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getRedis } from "@/lib/redis"

export const runtime = 'nodejs'

export async function POST() {
  try {
    const { db } = await connectToDatabase()
    const redis = getRedis()

    const lKey = 'featured:liquidation:list'
    const wKey = 'featured:weekly:list'

    // Clear compact Mongo collections
    await Promise.allSettled([
      db.collection('featured_liquidation').deleteMany({}),
      db.collection('featured_weekly').deleteMany({}),
    ])

    // Clear Redis persistent keys and bump version
    if (redis) {
      await Promise.allSettled([
        redis.del(lKey),
        redis.del(wKey),
        redis.incr('products:ver'),
      ])
    }

    return NextResponse.json({ success: true, cleared: { mongo: true, redis: Boolean(redis) } })
  } catch (error) {
    console.error('/api/featured/reset POST error:', error)
    const message = error instanceof Error ? error.message : String(error)
    return NextResponse.json({ message: 'Internal Server Error', error: message }, { status: 500 })
  }
}
