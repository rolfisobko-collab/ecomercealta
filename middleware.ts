import { NextRequest, NextResponse } from "next/server"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "alta-telefonia-secret-key-2024")

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

  // Redirect root to /gremio to avoid client-side flicker
  if (pathname === "/" || pathname === "") {
    const to = request.nextUrl.clone()
    to.pathname = "/gremio"
    return NextResponse.redirect(to)
  }

  // Solo aplicar middleware a rutas de admin (excepto login)
  if (!pathname.startsWith("/admin") || pathname === "/auth/admin-login") {
    return NextResponse.next()
  }

  // Permitir acceso a páginas de acceso denegado
  if (pathname === "/admin/access-denied") {
    return NextResponse.next()
  }

  // Manejar /admin root: redirigir a sección no protegida
  if (pathname === "/admin" || pathname === "/admin/") {
    const to = request.nextUrl.clone()
    to.pathname = "/admin/products"
    return NextResponse.redirect(to)
  }

  // Verificar cookie de sesión JWT
  const session = request.cookies.get("admin_session")
  if (!session) {
    const to = request.nextUrl.clone()
    to.pathname = "/auth/admin-login"
    to.searchParams.set("returnTo", pathname)
    return NextResponse.redirect(to)
  }

  try {
    await jwtVerify(session.value, JWT_SECRET)
    return NextResponse.next()
  } catch {
    const to = request.nextUrl.clone()
    to.pathname = "/auth/admin-login"
    to.searchParams.set("returnTo", pathname)
    return NextResponse.redirect(to)
  }
}

export const config = {
  matcher: ["/", "/admin", "/admin/:path*"],
}
