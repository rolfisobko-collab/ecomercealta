"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"

// Tipo para la respuesta de autenticación
type AuthResponse = {
  success: boolean
  error?: string
}

// Función para crear una cookie de sesión
async function createSessionCookie(userId: string, role: string, email: string, name: string): Promise<void> {
  // Crear un objeto de sesión
  const session = {
    userId,
    role,
    email,
    name,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8 horas
  }

  // Guardar la sesión en una cookie
  cookies().set({
    name: "admin_session",
    value: JSON.stringify(session),
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60, // 8 horas en segundos
  })
}

// Acción del servidor para iniciar sesión con credenciales
export async function loginWithCredentials(username: string, password: string): Promise<AuthResponse> {
  try {
    // Verificación simplificada para pruebas
    if (username === "administrador" && password === "admin") {
      await createSessionCookie("admin-user-id", "admin", "admin@example.com", "Administrador")
      return { success: true }
    }

    return { success: false, error: "Credenciales incorrectas" }
  } catch (error) {
    console.error("Error en la autenticación del administrador:", error)
    return { success: false, error: "Error en el servidor" }
  }
}

// Acción del servidor para acceso directo como administrador
export async function loginAsAdmin(): Promise<AuthResponse> {
  try {
    // Crear una sesión de administrador directamente
    await createSessionCookie(
      "admin-bypass", // ID ficticio
      "admin", // Rol de administrador
      "admin@example.com", // Email ficticio
      "Administrador", // Nombre para mostrar
    )
    return { success: true }
  } catch (error) {
    console.error("Error en el acceso directo como administrador:", error)
    return { success: false, error: "Error al crear la sesión" }
  }
}

// Acción del servidor para cerrar sesión
export async function logout() {
  cookies().delete("admin_session")
  redirect("/auth/admin-login")
}
