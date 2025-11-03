"use client"

import ProductCard from "./ProductCard"
import type { Product } from "@/models/Product"

interface ProductGridClientProps {
  products: Product[]
  compact?: boolean
  featured?: boolean
  limit?: number
}

export default function ProductGridClient({ products, compact = false, featured = false, limit }: ProductGridClientProps) {
  let list = products || []
  if (featured) {
    list = list.filter((p: any) => p.isInStock)
  }
  if (typeof limit === 'number') {
    list = list.slice(0, limit)
  }

  if (list.length === 0) {
    return <div className="col-span-full text-center">No hay productos disponibles</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
      {list.map((product) => (
        <div key={product.id} className="flex justify-center">
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
