import { getDatabaseProvider } from "@/lib/database-config"
import type { Category } from "@/models/Category"

// Servicio híbrido que usa API routes (MongoDB) en el navegador o servidor
export async function getAllCategories(): Promise<Category[]> {
  // En el navegador, usar servicio API (Firebase) para tener consistencia con los cambios en admin
  if (typeof window !== 'undefined') {
    try {
      const api = await import("../api/categoryService")
      return await api.getAllCategories()
    } catch (error) {
      console.error('Error fetching categories (client/API):', error)
      return []
    }
  }

  const provider = getDatabaseProvider()
  if (provider === 'mongodb') {
    const firebaseCategoryService = await import("../api/categoryService")
    return await firebaseCategoryService.getAllCategories()
  } else {
    const firebaseCategoryService = await import("../api/categoryService")
    return await firebaseCategoryService.getAllCategories()
  }
}

export async function getCategoryById(id: string): Promise<Category | null> {
  // En el navegador, usar servicio API (Firebase) directo
  if (typeof window !== 'undefined') {
    try {
      const api = await import("../api/categoryService")
      return await api.categoryService.getById(id)
    } catch (error) {
      console.error('Error fetching category by id (client/API):', error)
      return null
    }
  }

  const provider = getDatabaseProvider()
  if (provider === 'mongodb') {
    const mongodbCategoryService = await import("../mongodb/categoryService")
    return await mongodbCategoryService.categoryService.getById(id)
  } else {
    const firebaseCategoryService = await import("../api/categoryService")
    return await firebaseCategoryService.categoryService.getById(id)
  }
}

export async function createCategory(category: Category): Promise<Category> {
  // En el navegador, usar servicio API para evitar importar Mongoose
  if (typeof window !== 'undefined') {
    const api = await import("../api/categoryService")
    return await api.categoryService.create(category)
  }
  const provider = getDatabaseProvider()
  if (provider === 'mongodb') {
    const mongodbCategoryService = await import("../mongodb/categoryService")
    return await mongodbCategoryService.categoryService.create(category)
  } else {
    const firebaseCategoryService = await import("../api/categoryService")
    return await firebaseCategoryService.categoryService.create(category)
  }
}

export async function updateCategory(id: string, category: Partial<Category>): Promise<Category> {
  // En el navegador, usar servicio API para evitar importar Mongoose
  if (typeof window !== 'undefined') {
    const api = await import("../api/categoryService")
    return await api.categoryService.update(id, category)
  }
  const provider = getDatabaseProvider()
  if (provider === 'mongodb') {
    const mongodbCategoryService = await import("../mongodb/categoryService")
    return await mongodbCategoryService.categoryService.update(id, category)
  } else {
    const firebaseCategoryService = await import("../api/categoryService")
    return await firebaseCategoryService.categoryService.update(id, category)
  }
}

export async function deleteCategory(id: string): Promise<void> {
  // En el navegador, usar servicio API para evitar importar Mongoose
  if (typeof window !== 'undefined') {
    const api = await import("../api/categoryService")
    return await api.categoryService.delete(id)
  }
  const provider = getDatabaseProvider()
  if (provider === 'mongodb') {
    const mongodbCategoryService = await import("../mongodb/categoryService")
    return await mongodbCategoryService.categoryService.delete(id)
  } else {
    const firebaseCategoryService = await import("../api/categoryService")
    return await firebaseCategoryService.categoryService.delete(id)
  }
}

export async function searchCategories(searchTerm: string): Promise<Category[]> {
  // En el navegador, usar servicio API para evitar importar Mongoose
  if (typeof window !== 'undefined') {
    const api = await import("../api/categoryService")
    return await api.categoryService.search(searchTerm)
  }
  const provider = getDatabaseProvider()
  if (provider === 'mongodb') {
    const mongodbCategoryService = await import("../mongodb/categoryService")
    return await mongodbCategoryService.categoryService.search(searchTerm)
  } else {
    const firebaseCategoryService = await import("../api/categoryService")
    return await firebaseCategoryService.categoryService.search(searchTerm)
  }
}

// Exportar el servicio completo para compatibilidad
export const categoryService = {
  getAll: getAllCategories,
  getById: getCategoryById,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
  search: searchCategories,
  cleanup: async () => {
    const provider = getDatabaseProvider()
    if (provider === 'mongodb') {
      const mongodbCategoryService = await import("../mongodb/categoryService")
      mongodbCategoryService.categoryService.cleanup()
    } else {
      const firebaseCategoryService = await import("../api/categoryService")
      firebaseCategoryService.categoryService.cleanup()
    }
  }
}

