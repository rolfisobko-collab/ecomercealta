"use client"

import type React from "react"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTheme } from "next-themes"
import { Moon, Sun, Search, ShoppingCart, User, LogOut, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/context/CartContext"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { signOut } from "@/services/auth/authService"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useCurrency } from "@/context/CurrencyContext"

// Estilos CSS personalizados
const styles = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulseOnce {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

.animate-pulse-once {
  animation: pulseOnce 0.5s ease-out forwards;
}

.red-accent::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(to right, transparent, #dc2626 50%, transparent);
  transform: scaleX(0);
  transform-origin: bottom right;
  transition: transform 0.3s ease;
}

.red-accent:hover::after {
  transform: scaleX(1);
  transform-origin: bottom left;
}

.red-glow:focus {
  box-shadow: 0 0 0 2px rgba(220, 38, 38, 0.2);
}

.red-ring {
  position: relative;
}

.red-ring::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  padding: 2px;
  background: linear-gradient(to right, #dc2626, #ef4444);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.red-ring:hover::before {
  opacity: 1;
}
`

export default function SiteHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { totalItems } = useCart()
  const router = useRouter()
  const pathname = usePathname()
  const auth = useAuth()
  const { theme, setTheme } = useTheme()
  const { currency, setCurrency } = useCurrency()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cargar la preferencia de moneda desde localStorage al inicio
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCurrency = localStorage.getItem("preferredCurrency")
      if (savedCurrency === "USD" || savedCurrency === "ARS") {
        setCurrency(savedCurrency)
      }
    }
  }, [setCurrency])

  // Inyectar estilos CSS personalizados
  useEffect(() => {
    const styleElement = document.createElement("style")
    styleElement.innerHTML = styles
    document.head.appendChild(styleElement)
    return () => {
      document.head.removeChild(styleElement)
    }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}&includeTags=true`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault()
    router.push("/cart")
    // Forzar scroll al inicio después de un pequeño retraso para asegurar que la navegación se complete
    setTimeout(() => {
      window.scrollTo(0, 0)
    }, 100)
  }

  return (
    <header suppressHydrationWarning
      className={`sticky top-0 z-50 w-full backdrop-blur-lg ${
        pathname?.startsWith("/admin") || pathname?.startsWith("/auth") || pathname?.startsWith("/gremio") ? "hidden" : ""
      } ${
        (mounted && theme === "dark")
          ? "bg-gradient-to-b from-gray-900/95 to-gray-950/90 border-b border-red-900/40 shadow-lg shadow-red-900/10"
          : "bg-white/95 border-b border-red-500/20 shadow-sm"
      }`}
    >
      {/* Barra de acento rojo */}
      <div className="h-1 bg-gradient-to-r from-red-500/70 via-red-600 to-red-500/70"></div>

      {/* Main Navigation */}
      <div className="container px-4 mx-auto transition-all duration-300">
        <div className="flex h-16 sm:h-18 md:h-20 lg:h-24 items-center justify-between">
          <div className="flex-shrink-0 relative">
            <Link
              href="/"
              className="block transition-transform duration-200 hover:scale-105 focus:scale-105 red-accent relative"
              onClick={() => window.scrollTo(0, 0)}
            >
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alta-negro-Photoroom-2-VWXcnw60P64byJRzm8JVx4zpZPZm2j.png"
                alt="Alta Telefonía"
                className={`h-10 sm:h-12 md:h-14 lg:h-16 w-auto transition-all duration-300 ${
                  (mounted && theme === "dark") ? "filter invert brightness-[.85]" : ""
                }`}
              />
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newCurrency = currency === "ARS" ? "USD" : "ARS"
                setCurrency(newCurrency)
                localStorage.setItem("preferredCurrency", newCurrency)
              }}
              className={`h-10 w-10 rounded-full transition-all duration-200 red-ring ${
                (mounted && theme === "dark") ? "hover:bg-red-950/30 text-gray-300" : "hover:bg-red-50 text-gray-600"
              }`}
              aria-label={`Cambiar a ${currency === "ARS" ? "Dólares" : "Pesos"}`}
            >
              <span className="text-lg">{currency === "ARS" ? "🇦🇷" : "🇺🇸"}</span>
            </Button>
            {isSearchOpen ? (
              <form onSubmit={handleSearch} className="relative w-full max-w-sm animate-fade-in">
                <Search
                  className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${
                    (mounted && theme === "dark") ? "text-gray-400" : "text-gray-500"
                  }`}
                />
                <Input
                  type="search"
                  placeholder="Buscar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-10 pr-4 rounded-full border ${
                    (mounted && theme === "dark")
                      ? "bg-gray-800/60 border-gray-700 focus:border-red-800 placeholder:text-gray-500"
                      : "bg-gray-100 border-gray-200 focus:border-red-300"
                  } focus:ring-red-500/20 focus:ring-2 red-glow`}
                  autoFocus
                  onBlur={() => {
                    if (!searchQuery.trim()) {
                      setIsSearchOpen(false)
                    }
                  }}
                />
              </form>
            ) : (
              <Button
                variant={theme === "dark" ? "ghost" : "ghost"}
                size="icon"
                onClick={() => setIsSearchOpen(true)}
                className={`h-10 w-10 rounded-full transition-all duration-200 red-ring ${
                  (mounted && theme === "dark") ? "hover:bg-red-950/30 text-gray-300" : "hover:bg-red-50 text-gray-600"
                }`}
              >
                <Search className="h-5 w-5" />
                <span className="sr-only">Buscar</span>
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-10 w-10 rounded-full transition-all duration-200 red-ring ${
                    (mounted && theme === "dark") ? "hover:bg-red-950/30 text-gray-300" : "hover:bg-red-50 text-gray-600"
                  }`}
                >
                  {auth.user ? (
                    <Avatar className="h-8 w-8 border border-red-500/30">
                      {auth.user.photoURL ? (
                        <AvatarImage
                          src={auth.user.photoURL || "/placeholder.svg"}
                          alt={auth.user.displayName || "Usuario"}
                        />
                      ) : (
                        <AvatarFallback
                          className={`${(mounted && theme === "dark") ? "bg-red-950 text-gray-200" : "bg-red-100 text-red-700"}`}
                        >
                          {auth.user.displayName
                            ? auth.user.displayName
                                .split(" ")
                                .map((name) => name[0])
                                .join("")
                                .substring(0, 2)
                                .toUpperCase()
                            : "U"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="sr-only">Perfil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className={`w-56 p-2 ${
                  (mounted && theme === "dark") ? "bg-gray-900 border-gray-800 border-l-red-800" : "bg-white border-r-red-500"
                } border-l-2 border-r-2`}
              >
                {auth.user ? (
                  <>
                    <DropdownMenuLabel className={`${(mounted && theme === "dark") ? "text-gray-300" : ""}`}>
                      Mi Cuenta
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className={`${(mounted && theme === "dark") ? "bg-red-900/30" : "bg-red-100"}`} />
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile"
                        className={`cursor-pointer rounded-md transition-colors ${
                          (mounted && theme === "dark")
                            ? "hover:bg-red-950/30 focus:bg-red-950/20"
                            : "hover:bg-red-50 focus:bg-red-50"
                        }`}
                      >
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile#orders"
                        className={`cursor-pointer rounded-md transition-colors ${
                          (mounted && theme === "dark")
                            ? "hover:bg-red-950/30 focus:bg-red-950/20"
                            : "hover:bg-red-50 focus:bg-red-50"
                        }`}
                      >
                        Mis Órdenes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        href="/profile#favorites"
                        className={`cursor-pointer rounded-md transition-colors ${
                          (mounted && theme === "dark")
                            ? "hover:bg-red-950/30 focus:bg-red-950/20"
                            : "hover:bg-red-50 focus:bg-red-50"
                        }`}
                      >
                        Favoritos
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={`${(mounted && theme === "dark") ? "bg-red-900/30" : "bg-red-100"}`} />
                    <DropdownMenuItem
                      className={`cursor-pointer rounded-md transition-colors ${
                        (mounted && theme === "dark") ? "hover:bg-red-950/30 focus:bg-red-950/20" : "hover:bg-red-50 focus:bg-red-50"
                      }`}
                      onClick={() => signOut()}
                    >
                      <LogOut className="mr-2 h-4 w-4 text-red-500" />
                      <span>Cerrar Sesión</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link
                      href="/auth/login"
                      className={`cursor-pointer rounded-md transition-colors ${
                        (mounted && theme === "dark") ? "hover:bg-red-950/30 focus:bg-red-950/20" : "hover:bg-red-50 focus:bg-red-50"
                      }`}
                    >
                      Iniciar Sesión
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className={`${(mounted && theme === "dark") ? "bg-red-900/30" : "bg-red-100"}`} />
                <DropdownMenuItem
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={`cursor-pointer rounded-md transition-colors ${
                    (mounted && theme === "dark") ? "hover:bg-red-950/30 focus:bg-red-950/20" : "hover:bg-red-50 focus:bg-red-50"
                  }`}
                >
                  {(mounted && theme === "dark") ? (
                    <>
                      <Sun className="mr-2 h-4 w-4 text-amber-400" />
                      <span>Modo Claro</span>
                    </>
                  ) : (
                    <>
                      <Moon className="mr-2 h-4 w-4 text-red-600" />
                      <span>Modo Oscuro</span>
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {!pathname?.startsWith("/gremio") && (
              <>
                {/* Gremio quick access (icon-only on all viewports) */}
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                  <Link href="/gremio" aria-label="Ir a Gremio">
                    <Wrench className="h-5 w-5" />
                  </Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={`relative h-10 w-10 rounded-full transition-all duration-200 red-ring ${
                (mounted && theme === "dark") ? "hover:bg-red-950/30 text-gray-300" : "hover:bg-red-50 text-gray-600"
              }`}
              onClick={handleCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge
                  className={`absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs ${
                    (mounted && theme === "dark") ? "bg-red-600 text-white" : "bg-red-600 text-white"
                  } rounded-full transition-all duration-300 animate-pulse-once shadow-lg shadow-red-600/30`}
                >
                  {totalItems}
                </Badge>
              )}
              <span className="sr-only">Carrito</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
