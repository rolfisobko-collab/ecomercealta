import Dexie, { Table } from 'dexie'

export interface CachedProduct {
  id: string
  name: string
  price: number
  image1?: string
  images?: string[]
  category?: string
  isInStock?: boolean
  location?: string
  liquidation?: boolean
  weeklyOffer?: boolean
  updatedAt?: string | Date
  createdAt?: string | Date
}

export interface CachedCategory {
  id: string
  name: string
  updatedAt?: string | Date
}

export interface MetaKV {
  key: string
  value: string
}

class CatalogDB extends Dexie {
  products!: Table<CachedProduct, string>
  categories!: Table<CachedCategory, string>
  meta!: Table<MetaKV, string>

  constructor() {
    super('catalogDB')
    // v1: initial schema
    this.version(1).stores({
      products: 'id, category, updatedAt',
      categories: 'id, updatedAt',
      meta: 'key'
    })
    // v2: add location index to products
    this.version(2).stores({
      products: 'id, category, location, updatedAt',
      categories: 'id, updatedAt',
      meta: 'key'
    })
    // v3: add weeklyOffer index to products
    this.version(3).stores({
      products: 'id, category, location, weeklyOffer, updatedAt',
      categories: 'id, updatedAt',
      meta: 'key'
    })
  }
}

export const catalogDB = new CatalogDB()
