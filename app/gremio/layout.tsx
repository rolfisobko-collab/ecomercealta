"use client"

import Link from "next/link"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ReactNode, useState } from "react"
import { Boxes, ClipboardList, Moon, Sun, ShoppingCart, User, Wrench, PanelLeftOpen, PanelRightOpen, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { useCart } from "@/context/CartContext"
import { useAuth } from "@/context/AuthContext"
import { signOut } from "@/services/auth/authService"
import { useCurrency } from "@/context/CurrencyContext"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GremioUIProvider } from "@/context/GremioUIContext"

export const dynamic = 'force-dynamic'

const navItems = [
  { href: "/gremio", label: "Productos", Icon: Boxes },
  { href: "/gremio/orders", label: "Pedidos", Icon: ClipboardList },
  { href: "/gremio/servicios", label: "Servicios", Icon: Wrench },
  { href: "/gremio/solicitudes", label: "Solicitudes", Icon: ClipboardList },
]

export default function GremioLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Cargando Gremio…</div>}>
      <GremioLayoutInner>{children}</GremioLayoutInner>
    </Suspense>
  )
}

function GremioLayoutInner({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedCategory = searchParams.get("category") || ""
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const { totalItems, items, totalPrice } = useCart()
  const auth = useAuth()
  const { currency, setCurrency } = useCurrency()
  const [cartOpen, setCartOpen] = useState(false)
  const showDevNotice = true

  return (
    <GremioUIProvider value={{ openCart: () => setCartOpen(true) }}>
    <div className="relative">
    <div className={cn(
      "min-h-screen bg-gray-50 dark:bg-gray-900"
    )}>
      {/* Gremio Header (fixed) height aligns with top-24 (6rem) */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-40 h-24 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60"
      )}>
        <div className="h-full flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="block" title="Inicio">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alta-negro-Photoroom-2-VWXcnw60P64byJRzm8JVx4zpZPZm2j.png"
                alt="Alta Telefonía"
                className="h-14 md:h-16 w-auto"
              />
            </Link>
            <span className="text-2xl md:text-3xl font-bold tracking-tight">Gremio</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newCurrency = currency === "ARS" ? "USD" : "ARS"
                setCurrency(newCurrency)
                if (typeof window !== 'undefined') localStorage.setItem("preferredCurrency", newCurrency)
              }}
              aria-label={`Cambiar moneda`}
              className={cn(
                "h-10 w-10 rounded-full transition-all duration-200 red-ring",
                theme === "dark" ? "hover:bg-red-950/30 text-gray-300" : "hover:bg-red-50 text-gray-600"
              )}
              title={`Moneda: ${currency}`}
            >
              <span className="text-base">{currency === "ARS" ? "🇦🇷" : "🇺🇸"}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
              className="h-9 w-9"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  {auth.user ? (
                    <Avatar className="h-8 w-8">
                      {auth.user.photoURL ? (
                        <AvatarImage src={auth.user.photoURL || "/placeholder.svg"} alt={auth.user.displayName || "Usuario"} />
                      ) : (
                        <AvatarFallback>
                          {(auth.user.displayName || "U").split(" ").map(n=>n[0]).join("").substring(0,2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  <span className="sr-only">Perfil</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {auth.user ? (
                  <>
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Perfil</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile#orders">Mis Órdenes</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>Cerrar Sesión</DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login">Iniciar Sesión</Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => setCartOpen(true)}
              aria-label="Carrito"
            >
              <ShoppingCart className="h-5 w-5" />
              {totalItems > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 text-white rounded-full">
                  {totalItems}
                </Badge>
              )}
            </Button>
            {/* Home quick access (mobile icon) */}
            <Button variant="ghost" size="icon" className="sm:hidden" onClick={() => router.push("/")} aria-label="Ir a Inicio">
              <Home className="h-5 w-5" />
            </Button>
            {/* Home quick access (pill) */}
            <Button
              onClick={() => router.push("/")}
              className="hidden sm:inline-flex rounded-full bg-gradient-to-r from-red-600 to-rose-600 text-white hover:from-red-700 hover:to-rose-700 shadow-sm"
            >
              <Home className="h-4 w-4 mr-2" />
              Inicio
            </Button>
          </div>
        </div>
      </header>
      {/* Left-side Cart Drawer for Gremio */}
      {(() => {
        const [open, setOpen] = [cartOpen, setCartOpen]
        return open ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="absolute right-0 top-24 bottom-0 w-80 sm:w-96 bg-white dark:bg-gray-900 border-l shadow-xl flex flex-col">
              <div className="flex items-center justify-between px-4 h-12 border-b dark:border-gray-800">
                <h3 className="text-sm font-semibold">Carrito ({totalItems})</h3>
                <button
                  className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                {items.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400 px-1">Tu carrito está vacío</div>
                ) : (
                  items.map((it) => (
                    <div key={String(it.product.id)} className="flex items-center gap-3 border rounded-md p-2 dark:border-gray-800">
                      <img src={(it.product as any)?.image1 || (it.product as any)?.images?.[0] || "/placeholder.svg"} alt={it.product.name} className="w-12 h-12 rounded object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium truncate">{it.product.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Cant: {it.quantity}</div>
                      </div>
                      <div className="text-sm whitespace-nowrap">{it.product.price}</div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t px-4 py-3 dark:border-gray-800">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Total</span>
                  <span className="font-semibold">{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => router.push('/gremio/cart')}>Ver carrito completo</Button>
                  <Button variant="outline" onClick={() => router.push('/gremio/checkout')}>Pagar</Button>
                </div>
              </div>
            </aside>
          </div>
        ) : null
      })()}
      {/* Sidebar (fixed) */}
      <aside
        className={cn(
          "hidden md:flex fixed top-24 bottom-0 left-0 z-30 flex-col border-r bg-white/80 dark:bg-gray-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60 transition-[width] duration-200 overflow-y-auto",
          sidebarOpen ? "w-72" : "w-16"
        )}
      >
        <div className="h-16 flex items-center justify-end px-2 md:px-3 border-b">
          {sidebarOpen ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800"
              aria-label="Contraer sidebar"
              title="Contraer"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border hover:bg-gray-50 dark:hover:bg-gray-800"
              aria-label="Expandir sidebar"
              title="Expandir"
            >
              <PanelRightOpen className="h-4 w-4" />
            </button>
          )}
        </div>
        <nav className={cn("p-2", sidebarOpen ? "space-y-1" : "py-3") }>
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 rounded-md transition-colors",
                sidebarOpen ? "px-3 py-2" : "px-1 py-2 justify-center",
                pathname === href
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
              title={label}
            >
              <Icon className={cn("h-5 w-5", pathname === href ? "text-white" : "text-gray-500")} />
              {sidebarOpen && <span className="text-sm font-medium">{label}</span>}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
      </aside>

      {/* Main */}
      <div className={cn("relative flex min-h-screen flex-col min-w-0 pt-24", sidebarOpen ? "md:ml-72" : "md:ml-16")}>        
        <main className="flex-1 p-4 md:p-6 transition-all">{children}</main>
      </div>
    </div>

    
    </div>
    </GremioUIProvider>
  )
}
