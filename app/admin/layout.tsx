"use client"

import type React from "react"
import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  Tags,
  ShoppingCart,
  Users,
  LogOut,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  User,
  Home,
  Truck,
  Clock,
  Moon,
  Sun,
  Wallet,
  Wrench,
  Image,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { CurrencySelector } from "@/components/currency-selector"
import { PriceAlertBanner } from "@/components/admin/PriceAlertBanner"

interface AdminLayoutProps {
  children: React.ReactNode
}

interface UserPermissions {
  dashboard: boolean
  ventas: boolean
  caja: boolean
  deposito: boolean
  balances: boolean
  serviciotec: boolean
  registros: boolean
  deudas: boolean
  products: boolean
  categories: boolean
  suppliers: boolean
  purchases: boolean
  orders: boolean
  users: boolean
  servicios: boolean
}

// Permisos por defecto (TODOS habilitados)
const DEFAULT_PERMISSIONS: UserPermissions = {
  dashboard: true,
  ventas: true,
  caja: true,
  deposito: true,
  balances: true,
  serviciotec: true,
  registros: true,
  deudas: true,
  products: true,
  categories: true,
  suppliers: true,
  purchases: true,
  orders: true,
  users: true,
  servicios: true,
}

// Mapeo de rutas a permisos
const ROUTE_PERMISSIONS: Record<string, keyof UserPermissions> = {
  "/admin": "dashboard",
  "/admin/ventas": "ventas",
  "/admin/caja": "caja",
  "/admin/deposito": "deposito",
  "/admin/balances": "balances",
  "/admin/serviciotec": "serviciotec",
  "/admin/registros": "registros",
  "/admin/deudas": "deudas",
  "/admin/products": "products",
  "/admin/categories": "categories",
  "/admin/suppliers": "suppliers",
  "/admin/purchases": "purchases",
  "/admin/orders": "orders",
  "/admin/users": "users",
  "/admin/servicios": "servicios",
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toast } = useToast()
  const [adminName, setAdminName] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("usuario")
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null)
  const { theme, setTheme } = useTheme()

  // Verificar autenticación y permisos
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log("Verificando autenticación...")

        // Primero verificar localStorage
        const adminData = localStorage.getItem("adminData")
        const isAdmin = localStorage.getItem("isAdmin")

        if (!adminData || !isAdmin) {
          console.log("No hay datos en localStorage, redirigiendo al login")
          setIsAuthenticated(false)
          if (!pathname.includes("/auth/admin-login")) {
            router.push("/auth/admin-login")
          }
          return
        }

        try {
          const userData = JSON.parse(adminData)
          console.log("Datos del usuario desde localStorage:", userData)

          setAdminName(userData.name || "Usuario")
          setUserRole(userData.role || "usuario")

          // Asegurar que tenga todos los permisos por defecto
          const permissions = userData.permissions
            ? { ...DEFAULT_PERMISSIONS, ...userData.permissions }
            : DEFAULT_PERMISSIONS
          setUserPermissions(permissions)

          // Verificar si el usuario tiene permisos para la ruta actual
          const currentRoute = pathname as keyof typeof ROUTE_PERMISSIONS
          const requiredPermission = ROUTE_PERMISSIONS[currentRoute]

          if (requiredPermission && !permissions[requiredPermission]) {
            console.log(`Usuario no tiene permisos para ${requiredPermission}`)
            setIsAuthenticated(true)
            if (!pathname.includes("/admin/access-denied")) {
              router.push("/admin/access-denied")
            }
          } else {
            console.log("Usuario autenticado y con permisos")
            setIsAuthenticated(true)
          }

          // Verificar sesión en el servidor (si falla, crearla con userData y reintentar una vez)
          try {
            let response = await fetch("/api/auth/check-admin-session", { cache: 'no-store' })
            if (!response.ok) {
              try {
                await fetch("/api/auth/create-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(userData),
                })
                response = await fetch("/api/auth/check-admin-session", { cache: 'no-store' })
                if (!response.ok) {
                  console.warn("Sesión del servidor no válida luego de crear cookie. Continuando con localStorage")
                }
              } catch (createErr) {
                console.warn("No se pudo crear sesión del servidor:", createErr)
              }
            }
          } catch (serverError) {
            console.warn("Error verificando sesión del servidor:", serverError)
          }
        } catch (parseError) {
          console.error("Error parseando datos del usuario:", parseError)
          setIsAuthenticated(false)
          router.push("/auth/admin-login")
        }
      } catch (error) {
        console.error("Error al verificar autenticación:", error)
        setIsAuthenticated(false)
        router.push("/auth/admin-login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router, pathname, toast])

  // Si está cargando, mostrar pantalla de carga
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Cargando...</h2>
          <p className="text-gray-500">Verificando credenciales</p>
        </div>
      </div>
    )
  }

  // Si no está autenticado, no mostrar nada
  if (!isAuthenticated) {
    return null
  }

  const handleLogout = () => {
    try {
      // Eliminar datos de localStorage
      localStorage.removeItem("isAdmin")
      localStorage.removeItem("adminData")

      // Limpiar sesión del servidor
      fetch("/api/auth/logout", { method: "POST" }).catch(console.error)

      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      })
      router.push("/auth/admin-login")
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  // Función para verificar si el usuario tiene permisos para una ruta
  const hasPermission = (route: string): boolean => {
    if (!userPermissions) return true // Por defecto permitir acceso
    const permission = ROUTE_PERMISSIONS[route as keyof typeof ROUTE_PERMISSIONS]
    return permission ? userPermissions[permission] !== false : true
  }

  // Definir la navegación con secciones
  const navigationSections = [
    {
      title: "Principal",
      items: [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Ventas", href: "/admin/ventas", icon: Receipt },
        { name: "Caja", href: "/admin/caja", icon: Wallet },
        { name: "Depósito", href: "/admin/deposito", icon: Package },
        { name: "Balances", href: "/admin/balances", icon: Wallet },
        { name: "Servicio Técnico", href: "/admin/serviciotec", icon: Wrench },
        { name: "Servicios", href: "/admin/servicios", icon: Wrench },
        { name: "Servicios solicitados", href: "/admin/servicios-solicitados", icon: Wrench },
      ],
    },
    {
      title: "Transacciones",
      items: [
        { name: "Registros", href: "/admin/registros", icon: Clock },
        { name: "Deudas", href: "/admin/deudas", icon: CreditCard },
      ],
    },
    {
      title: "Inventario",
      items: [
        { name: "Productos", href: "/admin/products", icon: Package },
        { name: "Categorías", href: "/admin/categories", icon: Tags },
        { name: "Proveedores", href: "/admin/suppliers", icon: Truck },
        { name: "Movimientos", href: "/admin/purchases", icon: ArrowLeftRight },
      ],
    },
    {
      title: "Ventas",
      items: [{ name: "Pedidos", href: "/admin/orders", icon: ShoppingCart }],
    },
    {
      title: "Administración",
      items: [{ name: "Usuarios", href: "/admin/users", icon: Users }],
    },
    {
      name: "Contenido",
      items: [{ name: "Flyers y Banners", href: "/admin/flyers", icon: Image }],
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Sidebar moderno y estilizado */}
        <div className="fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo area con diseño mejorado */}
          <div className="flex items-center justify-center h-24 px-6 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
            <Link href="/admin" className="flex items-center justify-center w-full">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alta-negro-Photoroom-2-VWXcnw60P64byJRzm8JVx4zpZPZm2j.png"
                alt="Alta Telefonía"
                className="h-24 w-auto"
              />
            </Link>
          </div>

          {/* Espacio para logo */}
          <div className="h-6"></div>

          {/* Navegación moderna y organizada */}
          <div className="flex-1 overflow-y-auto py-6 px-4">
            <nav className="space-y-8">
              {navigationSections.map((section, sectionIndex) => {
                // Filtrar elementos según permisos del usuario
                const sectionItems = section.items.filter((item) => hasPermission(item.href))

                // Si no hay elementos para mostrar después del filtrado, no mostrar la sección
                if (sectionItems.length === 0) {
                  return null
                }

                return (
                  <div key={sectionIndex} className="space-y-2">
                    <h3 className="px-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {sectionItems.map((item) => {
                        const isActive =
                          pathname === item.href || (pathname.startsWith(`${item.href}/`) && item.href !== "/admin")

                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                              "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200",
                              isActive
                                ? "bg-gradient-to-r from-red-50 to-red-100 text-red-700 dark:from-red-900/30 dark:to-red-800/20 dark:text-red-400 shadow-sm"
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800/60 hover:translate-x-1",
                            )}
                          >
                            <item.icon
                              className={cn(
                                "mr-3 h-5 w-5",
                                isActive ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400",
                              )}
                            />
                            <span>{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </nav>
          </div>

          {/* Botón de cerrar sesión mejorado */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50">
            <Button
              variant="ghost"
              className="w-full justify-start bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white dark:text-white hover:text-white dark:hover:text-white border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-lg py-6"
              onClick={handleLogout}
            >
              <div className="flex items-center w-full">
                <div className="bg-white/20 p-2 rounded-md mr-3">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="font-medium">Cerrar sesión</span>
              </div>
            </Button>
          </div>
        </div>
        </div>

        {/* Main content con margen ajustado */}
        <div className="flex-1 pl-72 bg-gray-50 dark:bg-gray-900">
        {/* Page header area con diseño mejorado */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-md">
          {/* Elemento de unión redondeada */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 -ml-8 rounded-br-3xl"></div>

          <div className="px-8 py-3 flex items-center justify-between">
            {/* Información de la página y breadcrumbs */}
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                {pathname === "/admin"
                  ? "Dashboard"
                  : (pathname.split("/").pop()?.charAt(0).toUpperCase() || "") + (pathname.split("/").pop()?.slice(1) || "") || "Admin"}
              </h1>
            </div>

            {/* Acciones y perfil de usuario */}
            <div className="flex items-center space-x-4">
              {/* Botones de navegación rápidos */}
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent"
                onClick={() => router.push("/")}
              >
                <Home className="h-4 w-4 mr-2" />
                <span>Ver tienda</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent"
                onClick={() => router.push("/gremio")}
              >
                <Wrench className="h-4 w-4 mr-2" />
                <span>Gremio</span>
              </Button>

              {/* Botón para alternar tema */}
              <Button
                variant="outline"
                size="icon"
                className="border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 bg-transparent"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="sr-only">Cambiar tema</span>
              </Button>

              {/* Perfil de usuario */}
              {adminName && (
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-full pl-2 pr-4 py-1 shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white">
                      <User className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{adminName}</p>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Banner LED de alertas de precios */}
        {/* <PriceAlertBanner /> */}

        {/* Page content con diseño mejorado */}
        <main className="h-[calc(100vh-3.5rem)] p-8 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-6 relative">
                {/* Header mejorado con selector de moneda */}
                {(pathname === "/admin/ventas" || pathname === "/admin/caja") && (
                  <div className="relative z-10 mb-8">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 bg-gradient-to-r from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                            {pathname === "/admin/ventas"
                              ? "Sistema de Ventas"
                              : "Gestión de Caja"}
                          </h1>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {pathname === "/admin/ventas"
                              ? "Punto de venta y facturación"
                              : "Control de efectivo y movimientos"}
                          </p>
                        </div>
                      </div>

                      {/* Selector de moneda mejorado */}
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                            />
                          </svg>
                          <span>Moneda:</span>
                        </div>
                        <CurrencySelector />
                      </div>
                    </div>
                  </div>
                )}
                {/* Contenido principal con mejor espaciado */}
                <div className="relative z-10 p-8">{children}</div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
