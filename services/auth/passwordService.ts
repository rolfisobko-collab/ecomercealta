import * as crypto from "crypto"

// Función para hashear contraseñas
export function hashPassword(password: string): string {
  // En un entorno real, deberías usar bcrypt o argon2
  // Pero para este ejemplo, usamos crypto de Node.js
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex")
  return `${salt}:${hash}`
}

// Función para verificar contraseñas
export function verifyPassword(storedPassword: string, suppliedPassword: string): boolean {
  const [salt, storedHash] = storedPassword.split(":")
  const hash = crypto.pbkdf2Sync(suppliedPassword, salt, 1000, 64, "sha512").toString("hex")
  return storedHash === hash
}
