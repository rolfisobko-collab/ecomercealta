"use client"

import { Suspense } from "react"
import ServiciosPage from "@/app/servicio-tecnico/page"

export const dynamic = 'force-dynamic'

export default function GremioServiciosPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando servicios...</div>}>
      <ServiciosPage />
    </Suspense>
  )
}
