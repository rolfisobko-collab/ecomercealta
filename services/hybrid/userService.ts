import { getDatabaseProvider } from "@/lib/database-config"
import * as firebaseUserService from "../api/userService"
import * as mongodbUserService from "../mongodb/userService"
import type { User, UserFormData } from "@/models/User"

// Servicio híbrido que usa Firebase o MongoDB según la configuración
export async function getUsers(): Promise<User[]> {
  const provider = getDatabaseProvider()
  
  if (provider === 'mongodb') {
    return await mongodbUserService.getUsers()
  } else {
    return await firebaseUserService.getUsers()
  }
}

export async function getUser(id: string): Promise<User | null> {
  const provider = getDatabaseProvider()
  
  if (provider === 'mongodb') {
    return await mongodbUserService.getUser(id)
  } else {
    return await firebaseUserService.getUser(id)
  }
}

export async function createUser(userData: UserFormData): Promise<string | null> {
  const provider = getDatabaseProvider()
  
  if (provider === 'mongodb') {
    return await mongodbUserService.createUser(userData)
  } else {
    return await firebaseUserService.createUser(userData)
  }
}

export async function updateUser(id: string, userData: UserFormData): Promise<boolean> {
  const provider = getDatabaseProvider()
  
  if (provider === 'mongodb') {
    return await mongodbUserService.updateUser(id, userData)
  } else {
    return await firebaseUserService.updateUser(id, userData)
  }
}

export async function deleteUser(id: string): Promise<boolean> {
  const provider = getDatabaseProvider()
  
  if (provider === 'mongodb') {
    return await mongodbUserService.deleteUser(id)
  } else {
    return await firebaseUserService.deleteUser(id)
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const provider = getDatabaseProvider()
  
  if (provider === 'mongodb') {
    return await mongodbUserService.getUserByEmail(email)
  } else {
    return await firebaseUserService.getUserByEmail(email)
  }
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const provider = getDatabaseProvider()
  
  if (provider === 'mongodb') {
    return await mongodbUserService.getUserByUsername(username)
  } else {
    return await firebaseUserService.getUserByUsername(username)
  }
}

export async function authenticateUser(email: string, password: string): Promise<User | null> {
  const provider = getDatabaseProvider()
  
  if (provider === 'mongodb') {
    return await mongodbUserService.authenticateUser(email, password)
  } else {
    return await firebaseUserService.authenticateUser(email, password)
  }
}

