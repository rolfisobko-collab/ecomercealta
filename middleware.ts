import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Definir la interfaz de permisos
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
}

// Mapeo de rutas a permisos requeridos
const routePermissions: Record<string, keyof UserPermissions> = {
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
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Solo aplicar middleware a rutas de admin (excepto login)
  if (!pathname.startsWith("/admin") || pathname === "/auth/admin-login") {
    return NextResponse.next()
  }

  // Permitir acceso a páginas de acceso denegado
  if (pathname === "/admin/access-denied") {
    return NextResponse.next()
  }

  // Por ahora, permitir acceso a todas las rutas de admin
  // La verificación de permisos se hace en el cliente
  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
