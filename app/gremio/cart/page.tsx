"use client"

import { Suspense } from "react"
import CartPage from "@/app/cart/page"

export const dynamic = 'force-dynamic'

export default function GremioCartPage() {
  return (
    <Suspense fallback={<div className="p-6">Cargando carrito...</div>}>
      <CartPage />
    </Suspense>
  )
}
