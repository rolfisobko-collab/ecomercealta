export class Category {
  id: string
  name: string
  description: string
  imageUrl: string
  icon?: string
  createdAt: string
  updatedAt: string

  constructor(data: Partial<Category>) {
    this.id = data.id || ""
    this.name = data.name || ""
    this.description = data.description || ""
    this.imageUrl = data.imageUrl || ""
    this.icon = data.icon
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      icon: this.icon,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    }
  }

  static fromFirebase(data: any): Category {
    return new Category({
      id: data.id,
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      icon: data.icon,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    })
  }
}
