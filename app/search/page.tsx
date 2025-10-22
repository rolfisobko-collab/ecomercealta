"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Importar el componente de búsqueda dinámicamente para evitar ejecución en el servidor
const SearchPageContent = dynamic(() => import("@/components/search/SearchPageContent"), {
  ssr: false,
  loading: () => (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-10 w-full max-w-2xl" />
      </div>
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="hidden lg:block w-1/4">
          <Skeleton className="h-[500px] w-full rounded-lg" />
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} className="h-[300px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  ),
})

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <SearchPageContent />
    </Suspense>
  )
}
