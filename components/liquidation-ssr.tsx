import ProductCard from "@/components/product/ProductCard"
import { connectToDatabase } from "@/lib/mongodb"

// Server Component: renders instantly with ISR
export const revalidate = 60

export default async function LiquidationSSR() {
  try {
    const { db } = await connectToDatabase()

    const projection = {
      _id: 1,
      name: 1,
      price: 1,
      images: 1,
      image1: 1,
      liquidation: 1,
      updatedAt: 1,
    } as const

    const truthy: any[] = [true, "true", 1, "1", "yes", "on"]
    const filter: any = { liquidation: { $in: truthy } }
    const collections = ['stock','products','inventory','inventario','productos','items']

    const seen = new Set<string>()
    const out: any[] = []
    const limit = 12

    for (let i = 0; i < collections.length && out.length < limit; i++) {
      const colName = collections[i]
      try {
        const docs = await db.collection(colName)
          .find(filter, { projection })
          .sort({ updatedAt: -1, name: 1 })
          .limit(limit)
          .toArray()
        for (const d of docs) {
          const id = String(d._id)
          if (seen.has(id)) continue
          seen.add(id)
          out.push({ id, ...d })
          if (out.length >= limit) break
        }
      } catch {}
    }

    if (out.length === 0) return null

    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {out.map((product: any, i: number) => (
          <ProductCard key={product.id} product={product} compact={true} priority={i < 6} />
        ))}
      </div>
    )
  } catch {
    return null
  }
}
