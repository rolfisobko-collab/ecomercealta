export interface User {
  id: string
  name: string
  email: string
  password?: string // Solo se usa para la creación/edición, no se almacena en texto plano
  hashedPassword: string
  role: "admin" | "staff" | "user"
  active: boolean
  createdAt: Date
  updatedAt: Date
}

export interface UserFormData {
  id?: string
  name: string
  email: string
  password?: string
  role: "admin" | "staff" | "user"
  active: boolean
}
