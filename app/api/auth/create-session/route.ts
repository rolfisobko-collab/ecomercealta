import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "alta-telefonia-secret-key-2024")

export async function POST(request: NextRequest) {
  try {
    const userData = await request.json()

    console.log("Creando sesión para usuario:", userData)

    // Crear token JWT
    const token = await new SignJWT({
      userId: userData.id,
      name: userData.name,
      role: userData.role,
      email: userData.email,
      permissions: userData.permissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("8h")
      .sign(JWT_SECRET)

    // Establecer cookie de sesión
    cookies().set({
      name: "admin_session",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 8 * 60 * 60, // 8 horas
      path: "/",
      sameSite: "lax",
    })

    console.log("Sesión creada exitosamente")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error creando sesión:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
