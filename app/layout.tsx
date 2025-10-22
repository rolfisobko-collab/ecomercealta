import type React from "react"
import "@/app/globals.css"
import { Inter } from "next/font/google"
import { Providers } from "@/lib/providers"
import SiteHeader from "@/components/layout/site-header"
import SiteFooter from "@/components/layout/site-footer"
import { CartProvider } from "@/context/CartContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Alta Telefonía - Servicios Profesionales de Reparación de Dispositivos Móviles",
  description:
    "Servicios expertos de reparación para smartphones, tablets y laptops. Reparaciones rápidas, confiables y asequibles con piezas de calidad garantizadas.",
  icons: {
    icon: "/images/logo.png",
  },
    generator: 'v0.app'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className="light">
      <body className={`${inter.className} light`}>
        <CartProvider>
          <Providers>
            <div className="relative flex min-h-screen flex-col">
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </Providers>
        </CartProvider>
      </body>
    </html>
  )
}
