"use client"

import { useEffect, useState } from "react"

export function PriceAlertBanner() {
  const [productsWithoutPrice, setProductsWithoutPrice] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProductsWithoutPrice()
  }, [])

  const loadProductsWithoutPrice = async () => {
    try {
      const response = await fetch('/api/products')
      const products = await response.json()
      
      // Contar productos sin precio o con precio 0
      const withoutPrice = products.filter((p: any) => !p.price || p.price === 0).length
      setProductsWithoutPrice(withoutPrice)
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || productsWithoutPrice === null) {
    return null
  }

  const message = productsWithoutPrice === 0
    ? "✓✓✓ GRACIAS MILENA POR CARGAR LOS PRECIOS ✓✓✓ TODO COMPLETO ✓✓✓ EXCELENTE TRABAJO ✓✓✓"
    : `⚠ MILENA CARGA LOS PRECIOS POR FAVOR ⚠ SOLO FALTAN ${productsWithoutPrice} PRODUCTOS ⚠ MILENA CARGA LOS PRECIOS POR FAVOR ⚠ SOLO FALTAN ${productsWithoutPrice} PRODUCTOS ⚠`

  // Repetir el mensaje para que el scroll sea continuo
  const repeatedMessage = `${message} ${message} ${message}`

  return (
    <div className="bg-black border-y-2 border-green-500 overflow-hidden relative h-10">
      <style jsx>{`
        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .led-text {
          font-family: 'Courier New', monospace;
          font-weight: bold;
          letter-spacing: 0.15em;
          text-shadow: 
            0 0 5px currentColor,
            0 0 10px currentColor,
            0 0 15px currentColor,
            0 0 20px currentColor;
          animation: scroll-left 30s linear infinite;
        }
      `}</style>
      <div className="led-text absolute whitespace-nowrap text-green-500 text-xl py-2">
        {repeatedMessage}
      </div>
    </div>
  )
}
