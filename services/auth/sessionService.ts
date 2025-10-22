import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { cookies } from "next/headers"
import * as jose from "jose"

// Clave secreta para firmar los tokens JWT (en producción, usar variables de entorno)
const JWT_SECRET = new TextEncoder().encode("alta-telefonia-secret-key-2024")

// Duración de la sesión: 8 horas
const SESSION_DURATION = 8 * 60 * 60 // en segundos

interface SessionPayload {
  userId: string
  role: string
  email: string
  name: string
  exp: number
}

export async function createSession(userId: string, role: string, email: string, name: string) {
  // Crear un token JWT con la información del usuario
  const token = await new jose.SignJWT({ userId, role, email, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET)

  // Establecer la cookie de sesión
  cookies().set({
    name: "admin_session",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DURATION,
    path: "/",
  })

  return token
}

export async function verifyAdminSession(token: string): Promise<boolean> {
  try {
    // Verificar y decodificar el token
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    const decoded = payload as SessionPayload

    // Verificar que el usuario existe y sigue siendo administrador
    const userRef = doc(db, "users", decoded.userId as string)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      return false
    }

    const userData = userSnap.data()
    return userData.role === "admin" && userData.active === true
  } catch (error) {
    console.error("Error verificando sesión:", error)
    return false
  }
}

export function clearSession() {
  cookies().delete("admin_session")
}

export async function getCurrentUser(): Promise<{ id: string; name: string; email: string; role: string } | null> {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get("admin_session")

  if (!sessionCookie) {
    return null
  }

  try {
    const { payload } = await jose.jwtVerify(sessionCookie.value, JWT_SECRET)
    const decoded = payload as SessionPayload

    return {
      id: decoded.userId as string,
      name: decoded.name as string,
      email: decoded.email as string,
      role: decoded.role as string,
    }
  } catch (error) {
    console.error("Error obteniendo usuario actual:", error)
    return null
  }
}
