import { connectToMongoDB } from "@/lib/mongoose"
import { User } from "@/models/mongodb/User"
import type { User as UserType, UserFormData } from "@/models/User"
import { hashPassword } from "../auth/passwordService"

export async function getUsers(): Promise<UserType[]> {
  try {
    await connectToMongoDB()
    const users = await User.find({}).sort({ createdAt: -1 })
    
    return users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      hashedPassword: user.hashedPassword,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }))
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getUser(id: string): Promise<UserType | null> {
  try {
    await connectToMongoDB()
    const user = await User.findById(id)
    
    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      hashedPassword: user.hashedPassword,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function createUser(userData: UserFormData): Promise<string | null> {
  try {
    await connectToMongoDB()
    
    // Verificar si ya existe un usuario con el mismo email
    const existingUser = await getUserByEmail(userData.email)
    if (existingUser) {
      throw new Error("Ya existe un usuario con este email")
    }

    // Hashear la contraseña si se proporciona
    let hashedPassword = ""
    if (userData.password) {
      hashedPassword = hashPassword(userData.password)
    } else {
      throw new Error("La contraseña es obligatoria para crear un usuario")
    }

    const newUser = new User({
      name: userData.name,
      email: userData.email,
      hashedPassword,
      role: userData.role || "user",
      active: userData.active !== undefined ? userData.active : true,
    })

    const savedUser = await newUser.save()
    return savedUser._id.toString()
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(id: string, userData: UserFormData): Promise<boolean> {
  try {
    await connectToMongoDB()
    
    const user = await User.findById(id)
    if (!user) {
      throw new Error("Usuario no encontrado")
    }

    // Si se está actualizando el email, verificar que no exista otro usuario con ese email
    if (userData.email) {
      const existingUser = await getUserByEmail(userData.email)
      if (existingUser && existingUser.id !== id) {
        throw new Error("Ya existe otro usuario con este email")
      }
    }

    const updateData: any = {
      name: userData.name,
      email: userData.email,
      role: userData.role,
      active: userData.active,
    }

    // Solo actualizar la contraseña si se proporciona una nueva
    if (userData.password) {
      updateData.hashedPassword = hashPassword(userData.password)
    }

    await User.findByIdAndUpdate(id, updateData)
    return true
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    await connectToMongoDB()
    await User.findByIdAndDelete(id)
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

export async function getUserByEmail(email: string): Promise<UserType | null> {
  try {
    await connectToMongoDB()
    const user = await User.findOne({ email })
    
    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      hashedPassword: user.hashedPassword,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function getUserByUsername(username: string): Promise<UserType | null> {
  try {
    await connectToMongoDB()
    // Buscar por email (para compatibilidad)
    return await getUserByEmail(username)
  } catch (error) {
    console.error("Error fetching user by username:", error)
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<UserType | null> {
  try {
    const user = await getUserByEmail(email)
    if (!user) return null

    // Importar dinámicamente para evitar problemas con SSR
    const { verifyPassword } = await import("../auth/passwordService")

    if (verifyPassword(user.hashedPassword, password) && user.active) {
      // No devolver la contraseña hasheada
      const { hashedPassword, ...userWithoutPassword } = user
      return userWithoutPassword as UserType
    }

    return null
  } catch (error) {
    console.error("Error authenticating user:", error)
    return null
  }
}

