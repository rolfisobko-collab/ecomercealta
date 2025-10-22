"use client"

import { Suspense } from "react"
import CheckoutPage from "@/app/checkout/page"

export const dynamic = 'force-dynamic'

export default function GremioCheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando checkout...</div>}>
      <CheckoutPage />
    </Suspense>
  )
}
