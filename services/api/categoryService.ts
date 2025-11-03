import { Category } from "@/models/Category"
import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore"
import { categories as mockCategories } from "@/data/categories"

export class CategoryService {
  private collectionName = "stockCategories"
  private categoriesCache: Category[] | null = null
  private categoryListeners: Map<string, () => void> = new Map()
  private isListenerActive = false

  constructor() {
    // Configurar listener para mantener la caché actualizada en tiempo real
    this.setupCategoriesListener()
  }

  private setupCategoriesListener() {
    if (this.isListenerActive) return

    const categoriesCollection = collection(db, this.collectionName)

    // Crear un listener que actualiza la caché cuando hay cambios EN TIEMPO REAL
    const unsubscribe = onSnapshot(
      query(categoriesCollection, orderBy("name")),
      (snapshot) => {
        console.log("🔄 Categories listener triggered - updating cache in real time")

        if (!snapshot.empty) {
          this.categoriesCache = snapshot.docs.map((doc) => {
            const data = doc.data()
            return new Category({
              id: doc.id,
              name: data.name || "",
              description: data.description || "",
              imageUrl: data.imageUrl || "",
              icon: data.icon || "",
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            })
          })
          console.log(`✅ Categories cache updated with ${this.categoriesCache.length} items`)
        } else {
          console.log("📭 No categories found, using mock data")
          this.categoriesCache = mockCategories.map((c) => new Category(c))
        }
      },
      (error) => {
        console.error("❌ Error in categories listener:", error)
        // Fallback a datos mock en caso de error
        this.categoriesCache = mockCategories.map((c) => new Category(c))
      },
    )

    this.categoryListeners.set("all", unsubscribe)
    this.isListenerActive = true
    console.log("🎧 Categories real-time listener activated")
  }

  async getAll(): Promise<Category[]> {
    // Si ya tenemos datos en caché (actualizados por el listener), usarlos
    if (this.categoriesCache) {
      console.log("⚡ Using real-time cached categories data")
      return this.categoriesCache
    }

    // Si no hay caché aún, hacer una consulta inicial y esperar un poco para el listener
    try {
      console.log("🔍 Initial categories fetch...")
      const categoriesCollection = collection(db, this.collectionName)
      const snapshot = await getDocs(query(categoriesCollection, orderBy("name")))

      if (!snapshot.empty) {
        const categories = snapshot.docs.map((doc) => {
          const data = doc.data()
          return new Category({
            id: doc.id,
            name: data.name || "",
            description: data.description || "",
            imageUrl: data.imageUrl || "",
            icon: data.icon || "",
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt || new Date().toISOString(),
          })
        })

        this.categoriesCache = categories
        return categories
      } else {
        console.log("📭 No categories found in initial fetch, using mock data")
        const mockData = mockCategories.map((c) => new Category(c))
        this.categoriesCache = mockData
        return mockData
      }
    } catch (error) {
      console.error("❌ Error in initial categories fetch:", error)
      const mockData = mockCategories.map((c) => new Category(c))
      this.categoriesCache = mockData
      return mockData
    }
  }

  async getById(id: string): Promise<Category | null> {
    // Verificar si está en la caché en tiempo real
    if (this.categoriesCache) {
      const cachedCategory = this.categoriesCache.find((c) => c.id === id)
      if (cachedCategory) {
        console.log(`⚡ Using real-time cached data for category ${id}`)
        return cachedCategory
      }
    }

    try {
      const docRef = doc(db, this.collectionName, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return new Category({
          id: docSnap.id,
          name: data.name || "",
          description: data.description || "",
          imageUrl: data.imageUrl || "",
          icon: data.icon || "",
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
        })
      }

      // Si no se encuentra en Firebase, buscar en datos mock
      const mockCategory = mockCategories.find((c) => c.id === id)
      if (mockCategory) {
        return new Category(mockCategory)
      }

      return null
    } catch (error) {
      console.error("❌ Error fetching category:", error)

      // Fallback a datos mock
      const mockCategory = mockCategories.find((c) => c.id === id)
      if (mockCategory) {
        return new Category(mockCategory)
      }

      return null
    }
  }

  async create(category: Category): Promise<Category> {
    try {
      const categoriesCollection = collection(db, this.collectionName)

      // Preparar datos para guardar
      const categoryData = {
        name: category.name,
        description: category.description,
        imageUrl: category.imageUrl || "",
        icon: category.icon || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      console.log("➕ Creating new category...")
      // Guardar en Firestore - el listener se encargará de actualizar la caché automáticamente
      const docRef = await addDoc(categoriesCollection, categoryData)
      console.log(`✅ Category created with ID: ${docRef.id}`)

      // Devolver la categoría con el ID asignado
      return new Category({
        ...category,
        id: docRef.id,
      })
    } catch (error) {
      console.error("❌ Error creating category:", error)
      throw error
    }
  }

  async update(id: string, category: Partial<Category>): Promise<Category> {
    try {
      const docRef = doc(db, this.collectionName, id)

      // Preparar datos para actualizar
      const updateData = {
        ...category,
        icon: category.icon ?? (category as any).icon ?? "",
        updatedAt: new Date().toISOString(),
      }

      console.log(`📝 Updating category ${id}...`)
      // Actualizar en Firestore - el listener se encargará de actualizar la caché automáticamente
      await updateDoc(docRef, updateData)
      console.log(`✅ Category ${id} updated`)

      // Devolver la categoría actualizada
      return new Category({
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
      const docRef = doc(db, this.collectionName, id)
      // Eliminar de Firestore - el listener se encargará de actualizar la caché automáticamente
      await deleteDoc(docRef)
      console.log(`✅ Category ${id} deleted`)
    } catch (error) {
      console.error(`❌ Error deleting category ${id}:`, error)
      throw error
    }
  }

  async search(searchTerm: string): Promise<Category[]> {
    try {
      // Obtener todas las categorías (usará caché en tiempo real si está disponible)
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
      const categories = mockCategories.map((c) => new Category(c))
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

export const getAllCategories = async (): Promise<Category[]> => {
  try {
    return await categoryService.getAll()
  } catch (error) {
    console.error("❌ Error fetching all categories:", error)
    return []
  }
}
