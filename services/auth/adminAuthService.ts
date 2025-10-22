import { getUserByUsername, getUserByEmail } from "@/services/api/userService"
import { verifyPassword } from "@/services/auth/passwordService"

// Función para autenticar administradores
export async function authenticateAdmin(username: string, password: string): Promise<boolean> {
  try {
    // Normalizar el nombre de usuario
    const normalizedUsername = username.trim().toLowerCase()

    // Intentar autenticar primero con el email
    let user = await getUserByEmail(normalizedUsername)

    // Si no se encuentra por email, intentar con el nombre de usuario
    if (!user) {
      user = await getUserByUsername(normalizedUsername)
    }

    // Verificar si el usuario existe
    if (!user) {
      console.log("Usuario no encontrado:", normalizedUsername)
      return false
    }

    // Verificar si el usuario es administrador y está activo
    if (user.role !== "admin" || !user.active) {
      console.log("Usuario no es admin o no está activo:", user.role, user.active)
      return false
    }

    // Verificar la contraseña
    const isPasswordValid = verifyPassword(user.hashedPassword, password)

    if (!isPasswordValid) {
      console.log("Contraseña incorrecta")
      return false
    }

    // Autenticación exitosa
    return true
  } catch (error) {
    console.error("Error en la autenticación del administrador:", error)
    return false
  }
}

// Función para bypass de autenticación (acceso directo)
export async function bypassAuthentication(): Promise<boolean> {
  try {
    // En lugar de crear una cookie de sesión, simplemente devolvemos true
    // El componente cliente se encargará de guardar la sesión en localStorage
    return true
  } catch (error) {
    console.error("Error en el bypass de autenticación:", error)
    return false
  }
}
