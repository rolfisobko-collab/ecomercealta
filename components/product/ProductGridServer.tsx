import ProductGridClient from "./ProductGridClient"
import type { Product } from "@/models/Product"

interface Props {
  categoryId?: string
  query?: string
  limit?: number
  featured?: boolean
}

export const revalidate = 60

async function fetchProducts(categoryId?: string, query?: string, limit?: number): Promise<Product[]> {
  const params = new URLSearchParams()
  if (categoryId) params.set("category", categoryId)
  if (query) params.set("q", query)
  if (limit) params.set("limit", String(limit))

  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/products?${params.toString()}`.replace(/\?$|\?$/,'')
  const res = await fetch(url, { next: { revalidate: 60 } })
  if (!res.ok) {
    // fallback to runtime fetch without base url (works on server)
    const alt = await fetch(`/api/products?${params.toString()}`, { next: { revalidate: 60 } })
    if (!alt.ok) throw new Error(`Failed to load products: ${alt.status}`)
    return alt.json()
  }
  return res.json()
}

export default async function ProductGridServer({ categoryId, query, limit, featured }: Props) {
  const products = await fetchProducts(categoryId, query, limit)
  return <ProductGridClient products={products} featured={featured} limit={limit} />
}
