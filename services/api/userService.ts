import { db } from "@/lib/firebase"
import {
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  where,
  Timestamp,
} from "firebase/firestore"
import type { User, UserFormData } from "@/models/User"
import { hashPassword } from "../auth/passwordService"

export async function getUsers(): Promise<User[]> {
  try {
    const usersRef = collection(db, "users") // <-- AQUÍ: usa "users"
    const q = query(usersRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        name: data.name || "",
        email: data.email || "",
        hashedPassword: data.hashedPassword || "",
        role: data.role || "user",
        active: data.active !== undefined ? data.active : true,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}

export async function getUser(id: string): Promise<User | null> {
  try {
    const userRef = doc(db, "users", id)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return null
    }

    const data = userDoc.data()
    return {
      id: userDoc.id,
      name: data.name || "",
      email: data.email || "",
      hashedPassword: data.hashedPassword || "",
      role: data.role || "user",
      active: data.active !== undefined ? data.active : true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function createUser(userData: UserFormData): Promise<string | null> {
  try {
    // Verificar si ya existe un usuario con el mismo email
    const existingUser = await getUserByEmail(userData.email)
    if (existingUser) {
      throw new Error("Ya existe un usuario con este email")
    }

    const usersRef = collection(db, "users")
    const now = new Date()

    // Hashear la contraseña si se proporciona
    let hashedPassword = ""
    if (userData.password) {
      hashedPassword = hashPassword(userData.password)
    } else {
      throw new Error("La contraseña es obligatoria para crear un usuario")
    }

    const newUser = {
      name: userData.name,
      email: userData.email,
      hashedPassword,
      role: userData.role || "user",
      active: userData.active !== undefined ? userData.active : true,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now),
    }

    const docRef = await addDoc(usersRef, newUser)
    return docRef.id
  } catch (error) {
    console.error("Error creating user:", error)
    throw error
  }
}

export async function updateUser(id: string, userData: UserFormData): Promise<boolean> {
  try {
    const userRef = doc(db, "users", id)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
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
      updatedAt: Timestamp.fromDate(new Date()),
    }

    // Solo actualizar la contraseña si se proporciona una nueva
    if (userData.password) {
      updateData.hashedPassword = hashPassword(userData.password)
    }

    await updateDoc(userRef, updateData)
    return true
  } catch (error) {
    console.error("Error updating user:", error)
    throw error
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  try {
    const userRef = doc(db, "users", id)
    await deleteDoc(userRef)
    return true
  } catch (error) {
    console.error("Error deleting user:", error)
    return false
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("email", "==", email))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()

    return {
      id: doc.id,
      name: data.name || "",
      email: data.email || "",
      hashedPassword: data.hashedPassword || "",
      role: data.role || "user",
      active: data.active !== undefined ? data.active : true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  try {
    const usersRef = collection(db, "users")
    const q = query(usersRef, where("username", "==", username))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Si no se encuentra por username, intentar buscar por email (para compatibilidad)
      return await getUserByEmail(username)
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()

    return {
      id: doc.id,
      name: data.name || "",
      email: data.email || "",
      hashedPassword: data.hashedPassword || "",
      role: data.role || "user",
      active: data.active !== undefined ? data.active : true,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error fetching user by username:", error)
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  try {
    const user = await getUserByEmail(email)
    if (!user) return null

    // Importar dinámicamente para evitar problemas con SSR
    const { verifyPassword } = await import("../auth/passwordService")

    if (verifyPassword(user.hashedPassword, password) && user.active) {
      // No devolver la contraseña hasheada
      const { hashedPassword, ...userWithoutPassword } = user
      return userWithoutPassword as User
    }

    return null
  } catch (error) {
    console.error("Error authenticating user:", error)
    return null
  }
}
