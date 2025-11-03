import { NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongodb"
import { getRedis } from "@/lib/redis"

export const runtime = 'nodejs'

export async function GET(request: Request) {
  try {
    const { db } = await connectToDatabase()
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit')) || 12, 60)

    const redis = getRedis()
    const key = 'featured:liquidation:list'
    let items: any[] | null = null

    if (redis) {
      const hit = await redis.get<string>(key)
      if (hit) {
        const parsed = JSON.parse(hit)
        if (Array.isArray(parsed)) items = parsed.slice(0, limit)
      }
    }

    const isValid = (p: any) => !!p && typeof p.name === 'string' && p.name.trim().length > 0 && typeof p.price === 'number' && p.price > 0
    if (items) items = items.filter(isValid)

    if (!items) {
      // If Redis was empty or had invalid docs, fall back to compact collection
      const docs = await db
        .collection('featured_liquidation')
        .find({}, { projection: { _id: 1, name: 1, price: 1, image1: 1, images: 1 } })
        .sort({ updatedAt: -1, name: 1 })
        .limit(limit)
        .toArray()
      items = (docs || []).map((d) => ({ id: String(d._id), ...d })).filter(isValid)
      // Refresh Redis with valid docs to self-heal
      if (redis && Array.isArray(items)) {
        await redis.set(key, JSON.stringify(items))
      }
    }

    // Final fallback: if still empty, scan big collections and self-heal
    if (!items || items.length === 0) {
      const truthy: any[] = [true, "true", 1, "1", "yes", "on"]
      const filter: any = { liquidation: { $in: truthy } }
      const projection = { _id: 1, name: 1, price: 1, image1: 1, images: 1, updatedAt: 1 }
      const collections = ['stock','products','inventory','inventario','productos','items']
      const seen = new Set<string>()
      const out: any[] = []
      for (let i = 0; i < collections.length && out.length < limit; i++) {
        const colName = collections[i]
        try {
          const docs = await db.collection(colName).find(filter, { projection }).sort({ updatedAt: -1, name: 1 }).limit(limit).toArray()
          for (const d of docs) {
            const id = String(d._id)
            if (seen.has(id)) continue
            const rec = { id, ...d }
            if (isValid(rec)) {
              seen.add(id)
              out.push(rec)
              if (out.length >= limit) break
            }
          }
        } catch {}
      }
      if (out.length > 0) {
        items = out
        // Heal compact collection and Redis
        try {
          const col = db.collection('featured_liquidation')
          for (const rec of out) {
            await col.updateOne({ _id: rec.id }, { $set: { name: rec.name, price: rec.price, image1: rec.image1, images: rec.images, updatedAt: new Date() } }, { upsert: true })
          }
        } catch {}
        if (redis) {
          await redis.set(key, JSON.stringify(out))
        }
      }
    }

    const escapeHtml = (s: string) => s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c] as string))
    const html = `
<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
  ${
    (items || []).map((p: any) => {
      const img = p.image1 || (Array.isArray(p.images) && p.images[0]) || ''
      const name = escapeHtml(String(p.name || ''))
      const price = Number(p.price || 0)
      return `
      <a href="/products/${p.id}" class="group block rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow hover:shadow-lg transition-shadow">
        <div class="aspect-square bg-white dark:bg-gray-900 flex items-center justify-center">
          ${img ? `<img src="${img}" alt="${name}" class="h-full w-full object-contain p-4" loading="eager" />` : `<div class="h-full w-full bg-gray-100 dark:bg-gray-700"/>`}
        </div>
        <div class="p-3">
          <div class="text-sm line-clamp-2 text-gray-900 dark:text-gray-100">${name}</div>
          <div class="mt-1 text-red-600 font-bold">$${Number.isFinite(price) && price > 0 ? price.toLocaleString('es-AR') : '-'}</div>
        </div>
      </a>
      `
    }).join('')
  }
</div>`

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 's-maxage=60, stale-while-revalidate=600'
      }
    })
  } catch (error) {
    return new NextResponse('', { status: 500 })
  }
}
