import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  Timestamp,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"

// Definir la interfaz User con permisos
export interface InternalUser {
  id: string
  name: string
  username: string
  email?: string
  password: string
  role: string
  active: boolean
  permissions: UserPermissions
  createdAt: Date
  updatedAt: Date
}

export interface UserPermissions {
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

/**
 * Autentica un usuario interno
 */
export async function authenticateInternalUser(username: string, password: string): Promise<InternalUser | null> {
  try {
    const usersRef = collection(db, "internalUsers")
    const q = query(usersRef, where("username", "==", username), where("active", "==", true))
    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      throw new Error("Usuario no encontrado o inactivo")
    }

    const userDoc = querySnapshot.docs[0]
    const userData = userDoc.data()

    // Verificar contraseña (en un entorno real, esto debería usar hash)
    if (userData.password !== password) {
      throw new Error("Contraseña incorrecta")
    }

    // Asegurar que el usuario tenga TODOS los permisos por defecto
    const permissions = userData.permissions ? { ...DEFAULT_PERMISSIONS, ...userData.permissions } : DEFAULT_PERMISSIONS

    return {
      id: userDoc.id,
      name: userData.name || "",
      username: userData.username || "",
      email: userData.email || "",
      password: userData.password || "",
      role: userData.role || "tecnico",
      active: userData.active !== undefined ? userData.active : true,
      permissions,
      createdAt: userData.createdAt?.toDate() || new Date(),
      updatedAt: userData.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error authenticating internal user:", error)
    throw error
  }
}

/**
 * Obtiene todos los usuarios internos
 */
export async function getAllInternalUsers(): Promise<InternalUser[]> {
  try {
    const usersRef = collection(db, "internalUsers")
    const querySnapshot = await getDocs(usersRef)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      // Asegurar que todos los usuarios tengan TODOS los permisos por defecto
      const permissions = data.permissions ? { ...DEFAULT_PERMISSIONS, ...data.permissions } : DEFAULT_PERMISSIONS

      return {
        id: doc.id,
        name: data.name || "",
        username: data.username || "",
        email: data.email || "",
        password: data.password || "",
        role: data.role || "tecnico",
        active: data.active !== undefined ? data.active : true,
        permissions,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      }
    })
  } catch (error) {
    console.error("Error getting internal users:", error)
    throw error
  }
}

/**
 * Crea un nuevo usuario interno
 */
export async function createInternalUser(
  userData: Omit<InternalUser, "id" | "createdAt" | "updatedAt">,
): Promise<string> {
  try {
    const usersRef = collection(db, "internalUsers")

    // Verificar que el username no exista
    const existingUserQuery = query(usersRef, where("username", "==", userData.username))
    const existingUserSnapshot = await getDocs(existingUserQuery)

    if (!existingUserSnapshot.empty) {
      throw new Error("El nombre de usuario ya existe")
    }

    // Asegurar que el nuevo usuario tenga TODOS los permisos habilitados
    const userDataWithPermissions = {
      ...userData,
      permissions: userData.permissions ? { ...DEFAULT_PERMISSIONS, ...userData.permissions } : DEFAULT_PERMISSIONS,
    }

    const docRef = await addDoc(usersRef, {
      ...userDataWithPermissions,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    })

    return docRef.id
  } catch (error) {
    console.error("Error creating internal user:", error)
    throw error
  }
}

/**
 * Actualiza un usuario interno
 */
export async function updateInternalUser(userId: string, userData: Partial<InternalUser>): Promise<void> {
  try {
    const userRef = doc(db, "internalUsers", userId)

    // Si se está actualizando el username, verificar que no exista
    if (userData.username) {
      const usersRef = collection(db, "internalUsers")
      const existingUserQuery = query(usersRef, where("username", "==", userData.username))
      const existingUserSnapshot = await getDocs(existingUserQuery)

      // Verificar que no sea el mismo usuario
      const existingUser = existingUserSnapshot.docs.find((doc) => doc.id !== userId)
      if (existingUser) {
        throw new Error("El nombre de usuario ya existe")
      }
    }

    // Si se están actualizando permisos, asegurar que mantenga la estructura completa
    if (userData.permissions) {
      userData.permissions = { ...DEFAULT_PERMISSIONS, ...userData.permissions }
    }

    await updateDoc(userRef, {
      ...userData,
      updatedAt: Timestamp.fromDate(new Date()),
    })
  } catch (error) {
    console.error("Error updating internal user:", error)
    throw error
  }
}

/**
 * Elimina un usuario interno
 */
export async function deleteInternalUser(userId: string): Promise<void> {
  try {
    const userRef = doc(db, "internalUsers", userId)
    await deleteDoc(userRef)
  } catch (error) {
    console.error("Error deleting internal user:", error)
    throw error
  }
}

/**
 * Obtiene un usuario interno por ID
 */
export async function getInternalUserById(userId: string): Promise<InternalUser | null> {
  try {
    const userRef = doc(db, "internalUsers", userId)
    const userDoc = await getDoc(userRef)

    if (!userDoc.exists()) {
      return null
    }

    const data = userDoc.data()
    // Asegurar que el usuario tenga TODOS los permisos por defecto
    const permissions = data.permissions ? { ...DEFAULT_PERMISSIONS, ...data.permissions } : DEFAULT_PERMISSIONS

    return {
      id: userDoc.id,
      name: data.name || "",
      username: data.username || "",
      email: data.email || "",
      password: data.password || "",
      role: data.role || "tecnico",
      active: data.active !== undefined ? data.active : true,
      permissions,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    }
  } catch (error) {
    console.error("Error getting internal user by ID:", error)
    throw error
  }
}

/**
 * Verifica si un usuario tiene un permiso específico
 */
export function hasPermission(user: InternalUser, permission: keyof UserPermissions): boolean {
  // Si no tiene permisos definidos, por defecto tiene TODOS los permisos
  if (!user.permissions) {
    return true
  }
  return user.permissions[permission] !== undefined ? user.permissions[permission] : true
}

/**
 * Obtiene los permisos de un usuario por su ID
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions | null> {
  try {
    const user = await getInternalUserById(userId)
    return user ? user.permissions : DEFAULT_PERMISSIONS
  } catch (error) {
    console.error("Error getting user permissions:", error)
    return DEFAULT_PERMISSIONS
  }
}

/**
 * Obtiene los permisos por defecto (todos habilitados)
 */
export function getDefaultPermissions(): UserPermissions {
  return { ...DEFAULT_PERMISSIONS }
}
