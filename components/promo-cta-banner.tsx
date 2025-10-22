"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useCurrency } from "@/context/CurrencyContext"
import { useState, useEffect } from "react"
import { fetchExchangeRate } from "@/utils/currencyUtils"

interface PromoCTABannerProps {
  title?: string
  description?: string
  buttonText?: string
  buttonLink?: string
  termsText?: string
  termsLink?: string
  originalPrice?: number
  discountedPrice?: number
  imageUrl?: string
}

export default function PromoCTABanner({
  title = "iPhone 16 Pro Max",
  description = "Descubrí el nuevo iPhone 16 Pro Max con la mejor cámara y el chip más potente de Apple hasta la fecha.",
  buttonText = "Ver producto",
  buttonLink = "https://www.altatelefonia.com.ar/products/70159d8f-c177-41f8-980e-1676c75d7bdd",
  termsText = "Ver bases y condiciones",
  termsLink = "/terminos-y-condiciones",
  originalPrice = 1499,
  discountedPrice = 1250,
  imageUrl = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/iPhone-16-Pro-Max-lanzamiento.jpg-Y9YfExqsvxwFlU4fYjjPvWK9K2aUpH.jpeg",
}: PromoCTABannerProps) {
  const { currency } = useCurrency()
  const [exchangeRate, setExchangeRate] = useState(1100)
  const [config, setConfig] = useState<any>(null)

  useEffect(() => {
    const getExchangeRate = async () => {
      try {
        const rate = await fetchExchangeRate()
        if (rate) {
          setExchangeRate(rate)
        }
      } catch (error) {
        console.error("Error fetching exchange rate:", error)
      }
    }

    getExchangeRate()
  }, [])

  // Cargar configuración de flyers
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch("/api/flyers", { cache: "no-store" })
        if (res.ok) {
          const data = await res.json()
          setConfig(data)
        }
      } catch (error) {
        console.error("Error loading flyers config:", error)
      }
    }
    loadConfig()
  }, [])

  // Usar configuración dinámica si está disponible
  const bannerConfig = config?.promoBanner || {}
  const finalTitle = bannerConfig.title || title
  const finalDescription = bannerConfig.description || description
  const finalButtonText = bannerConfig.buttonText || buttonText
  const finalButtonLink = bannerConfig.buttonLink || buttonLink
  const finalTermsText = bannerConfig.termsText || termsText
  const finalTermsLink = bannerConfig.termsLink || termsLink
  const finalOriginalPrice = bannerConfig.originalPrice || originalPrice
  const finalDiscountedPrice = bannerConfig.discountedPrice || discountedPrice
  const finalImageUrl = bannerConfig.imageUrl || imageUrl

  // Precios convertidos según la moneda seleccionada
  const displayOriginalPrice = currency === "ARS" ? finalOriginalPrice * exchangeRate : finalOriginalPrice
  const displayDiscountedPrice = currency === "ARS" ? finalDiscountedPrice * exchangeRate : finalDiscountedPrice

  // Formatear precios con separadores de miles
  const formattedOriginalPrice = new Intl.NumberFormat("es-AR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(displayOriginalPrice)

  const formattedDiscountedPrice = new Intl.NumberFormat("es-AR", {
    style: "decimal",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(displayDiscountedPrice)
  return (
    <section className="w-full py-8 md:py-12">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl">
        <div className="relative w-full rounded-xl overflow-hidden bg-black">
          {/* Fondo con gradiente sutil */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-80"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-center">
            {/* Imagen principal - ahora a la izquierda */}
            <div className="w-full md:w-1/2 relative h-[200px] sm:h-[250px] md:h-[400px] overflow-hidden order-2 md:order-2">
              <Image
                src={finalImageUrl}
                alt="Banner promocional"
                fill
                className="object-contain"
                priority
              />
            </div>

            {/* Contenido principal - ahora a la derecha */}
            <div className="w-full md:w-1/2 px-6 py-8 md:py-10 text-center md:text-left order-1 md:order-1">
              <span className="inline-block px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold tracking-wider mb-4">
                NUEVO LANZAMIENTO
              </span>
              <h2 className="text-3xl md:text-5xl font-bold mb-3 text-white leading-tight">
                {finalTitle} <span className="text-red-400">Titanium</span>
              </h2>
              <p className="text-gray-300 mb-6 text-base md:text-lg max-w-2xl mx-auto">{finalDescription}</p>

              {/* Se removieron características fijas para evitar desactualizaciones */}

              {/* Botones y precio */}
              <div className="w-full py-6 flex flex-col sm:flex-row items-center md:items-start justify-center md:justify-start gap-4">
                <Button asChild className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 rounded-md font-medium">
                  <Link href={finalButtonLink}>
                    {finalButtonText}
                  </Link>
                </Button>

                <div className="flex items-center gap-2">
                  <span className="text-red-400 font-bold text-xl">${formattedDiscountedPrice}</span>
                  <span className="text-gray-400 text-sm line-through">${formattedOriginalPrice}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
