"use client"

import Link from "next/link"
import { Suspense } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { ReactNode, useEffect, useState } from "react"
import { Boxes, ClipboardList, Moon, Sun, ShoppingCart, ShoppingBag, User, Wrench, Home, Menu, EllipsisVertical, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  { href: "/gremio/perfil", label: "Perfil", Icon: User },
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
  const { totalItems, items, totalPrice, updateQuantity } = useCart()
  const auth = useAuth()
  const { currency, setCurrency } = useCurrency()
  const [cartOpen, setCartOpen] = useState(false)
  const showDevNotice = true
  const [searchOpen, setSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close cart on route change
  useEffect(() => {
    setCartOpen(false)
  }, [pathname])

  return (
    <GremioUIProvider value={{ openCart: () => setCartOpen(true) }}>
    <div className="relative">
    <div className={cn(
      "min-h-screen bg-gray-50 dark:bg-gray-900"
    )}>
      {/* Gremio Header (fixed) height aligns with top-24 (6rem) */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-40 h-16 border-b bg-black border-neutral-900"
      )}>
        <div className="h-full flex items-center justify-between px-4 gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/" className="block" title="Inicio">
              <img
                src="https://i.ibb.co/7tkP9MjR/Screenshot-2025-10-31-at-1-13-02-pm-removebg-preview.png"
                alt="Alta Telefonía"
                className="h-10 md:h-12 w-auto"
              />
            </Link>
            {/* Removed explicit 'Gremio' word next to logo to keep header cleaner */}
          </div>
          <div className="flex items-center gap-2 text-white">
            {/* Search trigger */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:text-white focus:text-white hover:bg-neutral-800/60"
              aria-label="Buscar"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newCurrency = currency === "ARS" ? "USD" : "ARS"
                setCurrency(newCurrency)
                if (typeof window !== 'undefined') localStorage.setItem("preferredCurrency", newCurrency)
              }}
              aria-label={`Cambiar moneda`}
              className={cn("h-11 w-11 rounded-full transition-all duration-200 red-ring text-white hover:text-white focus:text-white hover:bg-neutral-800/60")}
              title={`Moneda: ${currency}`}
            >
              <span className="text-base">{currency === "ARS" ? "🇦🇷" : "🇺🇸"}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:text-white focus:text-white hover:bg-neutral-800/60"
              aria-label="Carrito"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5" />
            </Button>
            {/* Theme and Profile: hidden on mobile, visible on md+ */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Cambiar tema"
              className="hidden md:inline-flex h-10 w-10 bg-transparent text-white hover:text-white focus:text-white hover:bg-neutral-800/60"
            >
              <span suppressHydrationWarning>
                {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Sun className="h-4 w-4" />}
              </span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden md:inline-flex h-10 w-10 text-white hover:bg-neutral-800/60">
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
            {/* Mobile hamburger: last on the right */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden h-10 w-10 rounded-full bg-neutral-800/60 border-neutral-700 text-white hover:bg-neutral-800/80" aria-label="Menú">
                  <EllipsisVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    <span>Inicio</span>
                  </Link>
                </DropdownMenuItem>
                {navItems.map(({ href, label, Icon }) => (
                  <DropdownMenuItem key={href} asChild>
                    <Link href={href} className="flex items-center gap-2">
                      <Icon className="h-4 w-4" />
                      <span>{label}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                  <span suppressHydrationWarning className="mr-2 inline-flex">
                    {mounted ? (theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />) : <Sun className="h-4 w-4" />}
                  </span>
                  <span>Cambiar tema</span>
                </DropdownMenuItem>
                {auth.user ? (
                  <DropdownMenuItem onClick={() => signOut()}>
                    <User className="h-4 w-4 mr-2" />
                    <span>Cerrar sesión</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem asChild>
                    <Link href="/auth/login" className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>Iniciar sesión</span>
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      {/* Search Overlay */}
      {(() => {
        const [open, setOpen] = [searchOpen, setSearchOpen]
        const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'Escape') setOpen(false)
          if (e.key === 'Enter') {
            const val = (e.target as HTMLInputElement).value || ''
            router.push(`/gremio${val ? `?q=${encodeURIComponent(val)}` : ''}`)
            setOpen(false)
          }
        }
        return open ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <div className="absolute top-24 left-0 right-0 px-3 md:px-0 flex justify-center">
              <div className="w-full max-w-2xl">
                <Input
                  autoFocus
                  placeholder="Buscar producto"
                  onKeyDown={onKeyDown}
                  className="h-12 rounded-full bg-white/95 text-gray-900 placeholder-gray-500 border border-gray-200 shadow-md focus-visible:ring-2 focus-visible:ring-black/20 px-5"
                />
              </div>
            </div>
          </div>
        ) : null
      })()}
      {/* Left-side Cart Drawer for Gremio */}
      {(() => {
        const [open, setOpen] = [cartOpen, setCartOpen]
        return open ? (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
            <aside className="absolute right-0 top-16 bottom-0 w-full sm:w-96 bg-white/85 dark:bg-gray-900/85 backdrop-blur-lg border-l border-gray-200/70 dark:border-gray-800/70 rounded-l-2xl shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-4 h-12 border-b border-gray-200/70 dark:border-gray-800/70">
                <h3 className="text-sm font-semibold">Carrito ({totalItems})</h3>
                <button
                  className="inline-flex h-8 items-center rounded-md border px-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-800"
                  onClick={() => setOpen(false)}
                >
                  Cerrar
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {items.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-10">Tu carrito está vacío</div>
                ) : (
                  items.map((it, idx) => (
                    <div key={idx} className="flex items-center gap-3 border rounded-xl p-2 bg-white/70 dark:bg-gray-900/60">
                      {(() => {
                        const anyIt: any = it
                        const p = anyIt?.product || anyIt
                        const imgCandidate = p?.image1
                          || (Array.isArray(p?.images) ? (typeof p.images[0] === 'string' ? p.images[0] : p.images[0]?.url) : null)
                          || p?.imageUrl
                          || p?.thumbnail
                          || null
                        const imgUrl = typeof imgCandidate === 'string' && imgCandidate.length > 0 ? imgCandidate : null
                        if (imgUrl) {
                          return <img src={imgUrl} className="h-12 w-12 object-contain rounded" alt={p?.name || 'Producto'} />
                        }
                        return (
                          <div className="h-12 w-12 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5"><path d="M3 7h18l-2 11a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L3 7Z"/><path d="M16 7a4 4 0 1 0-8 0"/></svg>
                          </div>
                        )
                      })()}
                      <div className="flex-1 min-w-0">
                        {(() => { const anyIt: any = it; const p = anyIt?.product || anyIt; const q = Number(anyIt?.quantity ?? 1); return (
                          <>
                            <div className="text-sm font-medium truncate">{p?.name || 'Producto'}</div>
                            <div className="mt-1 inline-flex items-center gap-2">
                              <button
                                className="h-7 w-7 text-sm rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => updateQuantity(p.id, Math.max(0, q - 1))}
                                aria-label="Disminuir"
                              >
                                −
                              </button>
                              <span className="text-xs text-gray-600 dark:text-gray-300 w-6 text-center">{q}</span>
                              <button
                                className="h-7 w-7 text-sm rounded-full bg-red-600 hover:bg-red-700 text-white"
                                onClick={() => updateQuantity(p.id, q + 1)}
                                aria-label="Aumentar"
                              >
                                +
                              </button>
                            </div>
                          </>
                        ) })()}
                      </div>
                      <div className="text-sm font-semibold">
                        {(() => {
                          const anyIt: any = it
                          const p = anyIt?.product || anyIt
                          const raw = Number(anyIt?.price ?? p?.price)
                          const price = Number.isFinite(raw) && raw > 0 ? raw : 0
                          if (currency === 'USD') {
                            return `$ ${price.toFixed(2)}`
                          }
                          return `$ ${price.toLocaleString('es-AR')}`
                        })()}
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-gray-200/70 dark:border-gray-800/70 p-3 bg-white/70 dark:bg-gray-900/60 rounded-b-2xl">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Total</span>
                  <strong>
                    {(() => {
                      const subtotalRaw = items.reduce((sum, it: any) => {
                        const prod = (it as any)?.product || it
                        const raw = Number((it as any)?.price ?? prod?.price)
                        const q = Number((it as any)?.quantity)
                        const price = Number.isFinite(raw) ? raw : 0
                        const qty = Number.isFinite(q) && q > 0 ? q : 1
                        return sum + price * qty
                      }, 0)
                      const subtotal = Number.isFinite(subtotalRaw) ? subtotalRaw : 0
                      if (currency === 'USD') return `$ ${subtotal.toFixed(2)}`
                      return `$ ${subtotal.toLocaleString('es-AR')}`
                    })()}
                  </strong>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-full bg-black/90 hover:bg-black text-white"
                    onClick={() => { setCartOpen(false); router.push('/gremio/cart') }}
                  >
                    Ver carrito
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => { setCartOpen(false); router.push('/gremio/checkout') }}
                  >
                    Pagar
                  </Button>
                </div>
              </div>
            </aside>
          </div>
        ) : null
      })()}
      {/* Sidebar (fixed) */}
      <aside
        className={cn(
          "hidden md:flex fixed top-16 bottom-0 left-0 z-30 flex-col border-r border-gray-200/70 dark:border-gray-800/70 bg-white/90 dark:bg-gray-900/80 shadow-lg transition-[width] duration-300 ease-out overflow-y-auto",
          sidebarOpen ? "w-72" : "w-24"
        )}
      >
        <div className="h-16 flex items-center justify-end px-2 md:px-3 border-b border-gray-200/70 dark:border-gray-800/70">
          {sidebarOpen ? (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="inline-flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-gray-200/70 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md shadow-sm hover:shadow transition-all"
              aria-label="Contraer sidebar"
              title="Contraer"
            >
              <ChevronLeft className="h-4 w-4 md:h-5 md:w-5 text-gray-700 dark:text-gray-200" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="inline-flex h-9 w-9 md:h-10 md:w-10 items-center justify-center rounded-full border border-gray-200/70 dark:border-gray-700 bg-white/80 dark:bg-gray-800/60 backdrop-blur-md shadow-sm hover:shadow transition-all"
              aria-label="Expandir sidebar"
              title="Expandir"
            >
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5 text-gray-700 dark:text-gray-200" />
            </button>
          )}
        </div>
        <nav className={cn("p-2 md:p-3", sidebarOpen ? "space-y-1.5" : "py-3") }>
          {navItems.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl transition-all duration-200",
                sidebarOpen ? "px-3 py-2 md:px-6 md:py-3.5" : "px-2 py-3 justify-center",
                pathname === href
                  ? "bg-red-600 text-white shadow-sm"
                  : "text-gray-800 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border hover:border-gray-200/80 dark:hover:border-gray-700/80"
              )}
              title={label}
            >
              <Icon className={cn(sidebarOpen ? "h-6 w-6 md:h-7 md:w-7" : "h-8 w-8 md:h-9 md:w-9", pathname === href ? "text-white" : "text-gray-500 dark:text-gray-400")} />
              {sidebarOpen && (
                <span className={cn("text-sm md:text-base font-medium whitespace-nowrap ml-2 md:ml-3")}>{label}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="flex-1" />
      </aside>

      {/* Main */}
      <div className={cn("relative flex min-h-screen flex-col min-w-0 pt-16 transition-[margin] duration-300 ease-out", sidebarOpen ? "ml-0 md:ml-72" : "ml-0 md:ml-24")}>        
        <main className="flex-1 p-2 md:p-3 transition-all">{children}</main>
      </div>
    </div>

    
    </div>
    </GremioUIProvider>
  )
}
