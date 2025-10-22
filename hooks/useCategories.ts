"use client"

import { useState, useEffect } from "react"
import type { Category } from "@/models/Category"
import { categoryService } from "@/services/hybrid/categoryService"

export function useCategories(query?: string) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        console.log("🔄 useCategories: Fetching categories...")

        let data: Category[]
        if (query) {
          data = await categoryService.search(query)
        } else {
          data = await categoryService.getAll()
        }

        console.log(`✅ useCategories: Fetched ${data.length} categories`)
        setCategories(data)
      } catch (err) {
        console.error("❌ Error in useCategories:", err)
        setError(err instanceof Error ? err : new Error("Error desconocido"))
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [query])

  return { categories, loading, error }
}
