"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import { Skeleton } from "@/components/ui/skeleton"

// Importar el componente dinámicamente para evitar ejecución en el servidor
const FirebaseImagesContent = dynamic(() => import("@/components/images/FirebaseImagesContent"), {
  ssr: false,
  loading: () => (
    <div className="container px-4 py-8 md:px-6 md:py-12">
      <div className="mb-8">
        <Skeleton className="h-10 w-64 mb-4" />
        <Skeleton className="h-6 w-full max-w-2xl mb-8" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(15)].map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  ),
})

export default function ImagesPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <FirebaseImagesContent />
    </Suspense>
  )
}
