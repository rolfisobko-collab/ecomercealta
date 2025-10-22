import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtVerify } from "jose"

export const dynamic = 'force-dynamic'
export const revalidate = 0

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "alta-telefonia-secret-key-2024")

export async function GET(request: NextRequest) {
  try {
    // Next 15: cookies() may be async; also fallback to request.cookies
    const cookieStore = typeof (cookies as any) === 'function' ? await (cookies as any)() : undefined
    const sessionCookie = cookieStore?.get?.("admin_session") || request.cookies.get("admin_session")

    if (!sessionCookie) {
      console.log("No se encontró cookie de sesión")
      return NextResponse.json({ error: "No session found" }, { status: 401 })
    }

    try {
      const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET)

      console.log("Sesión verificada para usuario:", payload.name)

      return NextResponse.json({
        name: payload.name,
        role: payload.role,
        email: payload.email,
        permissions: payload.permissions,
      })
    } catch (jwtError) {
      console.error("Error verificando JWT:", jwtError)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }
  } catch (error) {
    console.error("Error verificando sesión:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
