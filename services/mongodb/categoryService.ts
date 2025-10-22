import { connectToMongoDB } from "@/lib/mongoose"
import { Category } from "@/models/mongodb/Category"
import { Category as CategoryType } from "@/models/Category"
import { categories as mockCategories } from "@/data/categories"

export class CategoryService {
  private collectionName = "stockCategories"
  private categoriesCache: CategoryType[] | null = null
  private categoryListeners: Map<string, () => void> = new Map()
  private isListenerActive = false

  constructor() {
    // Configurar listener para mantener la caché actualizada
    this.setupCategoriesListener()
  }

  private async setupCategoriesListener() {
    if (this.isListenerActive) return

    try {
      await connectToMongoDB()
      // MongoDB no tiene listeners en tiempo real como Firebase, 
      // pero podemos implementar polling o usar MongoDB Change Streams
      this.isListenerActive = true
      console.log("🎧 Categories service initialized")
    } catch (error) {
      console.error("❌ Error setting up categories listener:", error)
    }
  }

  async getAll(): Promise<CategoryType[]> {
    // Si ya tenemos datos en caché, usarlos
    if (this.categoriesCache) {
      console.log("⚡ Using cached categories data")
      return this.categoriesCache
    }

    // Si no hay caché aún, hacer una consulta inicial
    try {
      console.log("🔍 Initial categories fetch...")
      await connectToMongoDB()
      const categories = await Category.find({}).sort({ name: 1 })

      if (categories.length > 0) {
        const transformedCategories = categories.map(category => new CategoryType({
          id: category._id.toString(),
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        }))

        this.categoriesCache = transformedCategories
        return transformedCategories
      } else {
        console.log("📭 No categories found, using mock data")
        const mockData = mockCategories.map((c) => new CategoryType(c))
        this.categoriesCache = mockData
        return mockData
      }
    } catch (error) {
      console.error("❌ Error in initial categories fetch:", error)
      const mockData = mockCategories.map((c) => new CategoryType(c))
      this.categoriesCache = mockData
      return mockData
    }
  }

  async getById(id: string): Promise<CategoryType | null> {
    // Verificar si está en la caché
    if (this.categoriesCache) {
      const cachedCategory = this.categoriesCache.find((c) => c.id === id)
      if (cachedCategory) {
        console.log(`⚡ Using cached data for category ${id}`)
        return cachedCategory
      }
    }

    try {
      await connectToMongoDB()
      const category = await Category.findById(id)

      if (category) {
        return new CategoryType({
          id: category._id.toString(),
          name: category.name,
          description: category.description,
          imageUrl: category.imageUrl,
          createdAt: category.createdAt.toISOString(),
          updatedAt: category.updatedAt.toISOString(),
        })
      }

      // Si no se encuentra en MongoDB, buscar en datos mock
      const mockCategory = mockCategories.find((c) => c.id === id)
      if (mockCategory) {
        return new CategoryType(mockCategory)
      }

      return null
    } catch (error) {
      console.error("❌ Error fetching category:", error)

      // Fallback a datos mock
      const mockCategory = mockCategories.find((c) => c.id === id)
      if (mockCategory) {
        return new CategoryType(mockCategory)
      }

      return null
    }
  }

  async create(category: CategoryType): Promise<CategoryType> {
    try {
      await connectToMongoDB()

      // Preparar datos para guardar
      const categoryData = {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl || "",
      }

      console.log("➕ Creating new category...")
      const newCategory = new Category(categoryData)
      const savedCategory = await newCategory.save()
      console.log(`✅ Category created with ID: ${savedCategory._id}`)

      // Devolver la categoría con el ID asignado
      return new CategoryType({
        ...category,
        id: savedCategory._id.toString(),
      })
    } catch (error) {
      console.error("❌ Error creating category:", error)
      throw error
    }
  }

  async update(id: string, category: Partial<CategoryType>): Promise<CategoryType> {
    try {
      await connectToMongoDB()

      // Preparar datos para actualizar
      const updateData = {
        ...category,
        updatedAt: new Date(),
      }

      console.log(`📝 Updating category ${id}...`)
      await Category.findByIdAndUpdate(id, updateData)
      console.log(`✅ Category ${id} updated`)

      // Devolver la categoría actualizada
      return new CategoryType({
        ...category,
        id,
      })
    } catch (error) {
      console.error(`❌ Error updating category ${id}:`, error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      console.log(`🗑️ Deleting category ${id}...`)
      await connectToMongoDB()
      await Category.findByIdAndDelete(id)
      console.log(`✅ Category ${id} deleted`)
    } catch (error) {
      console.error(`❌ Error deleting category ${id}:`, error)
      throw error
    }
  }

  async search(searchTerm: string): Promise<CategoryType[]> {
    try {
      // Obtener todas las categorías (usará caché si está disponible)
      const categories = await this.getAll()

      if (!searchTerm) return categories

      const lowerSearchTerm = searchTerm.toLowerCase()
      return categories.filter(
        (category) =>
          category.name.toLowerCase().includes(lowerSearchTerm) ||
          category.description.toLowerCase().includes(lowerSearchTerm),
      )
    } catch (error) {
      console.error("❌ Error searching categories:", error)

      // Fallback a datos mock
      const categories = mockCategories.map((c) => new CategoryType(c))
      if (!searchTerm) return categories

      const lowerSearchTerm = searchTerm.toLowerCase()
      return categories.filter(
        (category) =>
          category.name.toLowerCase().includes(lowerSearchTerm) ||
          category.description.toLowerCase().includes(lowerSearchTerm),
      )
    }
  }

  // Limpiar listeners cuando ya no se necesiten
  cleanup() {
    console.log("🧹 Cleaning up category listeners...")
    this.categoryListeners.forEach((unsubscribe) => unsubscribe())
    this.categoryListeners.clear()
    this.isListenerActive = false
  }
}

// Singleton para usar en toda la aplicación
export const categoryService = new CategoryService()

export const getAllCategories = async (): Promise<CategoryType[]> => {
  try {
    return await categoryService.getAll()
  } catch (error) {
    console.error("❌ Error fetching all categories:", error)
    return []
  }
}

