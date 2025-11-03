export class Product {
  id: string
  name: string
  description: string
  price: number
  cost?: number
  points?: number
  stock: number
  categoryId: string
  images: string[]
  isInStock: boolean
  location?: string // Ubicación del producto (ej: "Estante A", "Depósito", "Mostrador")
  createdAt: string
  updatedAt?: string
  lastManualUpdate?: string // Nueva propiedad para registrar modificaciones manuales

  constructor(data: Partial<Product>) {
    this.id = data.id || ""
    this.name = data.name || ""
    this.description = data.description || ""
    this.price = data.price || 0
    this.cost = data.cost || 0
    this.points = data.points || undefined
    this.stock = data.stock || 0
    this.categoryId = data.categoryId || ""
    this.images = data.images || []
    this.isInStock = data.isInStock || false
    this.location = data.location || ""
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
    this.lastManualUpdate = data.lastManualUpdate || undefined
  }

  get profit(): number {
    return this.price - (this.cost || 0)
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      cost: this.cost,
      points: this.points,
      stock: this.stock,
      categoryId: this.categoryId,
      images: this.images,
      isInStock: this.isInStock,
      location: this.location,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastManualUpdate: this.lastManualUpdate,
    }
  }

  static fromFirebase(data: any): Product {
    return new Product({
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price,
      cost: data.cost || 0,
      points: data.points,
      stock: data.stock || 0,
      categoryId: data.categoryId || "",
      images: data.images || [],
      isInStock: data.isInStock || false,
      location: data.location || "",
      createdAt: data.createdAt,
      updatedAt: data.updatedAt || new Date().toISOString(),
      lastManualUpdate: data.lastManualUpdate || undefined,
    })
  }
}

export interface CreateProductData {
  name: string
  description: string
  price: number
  cost?: number
  stock: number
  categoryId: string
  images: string[]
  location?: string
}

export interface UpdateProductData extends Partial<CreateProductData> {
  id: string
}
