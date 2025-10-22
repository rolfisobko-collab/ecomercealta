import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
  getDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Supplier, SupplierFormData } from "@/models/Supplier"

const COLLECTION_NAME = "suppliers"

class SupplierService {
  async getAll(): Promise<Supplier[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as Supplier
      })
    } catch (error) {
      console.error("Error getting suppliers:", error)
      throw error
    }
  }

  async getById(id: string): Promise<Supplier | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(docRef)

      if (!docSnap.exists()) {
        return null
      }

      const data = docSnap.data()
      return {
        ...data,
        id: docSnap.id,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Supplier
    } catch (error) {
      console.error("Error getting supplier:", error)
      throw error
    }
  }

  async create(formData: SupplierFormData): Promise<string> {
    try {
      const newSupplier = {
        ...formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newSupplier)
      return docRef.id
    } catch (error) {
      console.error("Error creating supplier:", error)
      throw error
    }
  }

  async update(id: string, formData: Partial<SupplierFormData>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(docRef, {
        ...formData,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating supplier:", error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Error deleting supplier:", error)
      throw error
    }
  }

  async getByCategory(category: string): Promise<Supplier[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("category", "==", category), orderBy("name", "asc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as Supplier
      })
    } catch (error) {
      console.error(`Error getting suppliers by category ${category}:`, error)
      throw error
    }
  }

  async search(searchTerm: string): Promise<Supplier[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("name", "asc"))
      const querySnapshot = await getDocs(q)

      const searchTermLower = searchTerm.toLowerCase()

      return querySnapshot.docs
        .map((doc) => {
          const data = doc.data()
          const supplier = {
            ...data,
            id: doc.id,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
            updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
          } as Supplier

          if (
            supplier.name.toLowerCase().includes(searchTermLower) ||
            supplier.contactName.toLowerCase().includes(searchTermLower) ||
            supplier.email.toLowerCase().includes(searchTermLower) ||
            supplier.phone.toLowerCase().includes(searchTermLower) ||
            supplier.address.toLowerCase().includes(searchTermLower) ||
            supplier.notes.toLowerCase().includes(searchTermLower)
          ) {
            return supplier
          }
          return null
        })
        .filter((supplier) => supplier !== null) as Supplier[]
    } catch (error) {
      console.error(`Error searching suppliers with term ${searchTerm}:`, error)
      throw error
    }
  }
}

export const supplierService = new SupplierService()

export const createSupplier = async (formData: SupplierFormData): Promise<string> => {
  return await supplierService.create(formData)
}

export const updateSupplier = async (id: string, formData: Partial<SupplierFormData>): Promise<void> => {
  return await supplierService.update(id, formData)
}

export const getSuppliers = async (): Promise<Supplier[]> => {
  return await supplierService.getAll()
}

export const deleteSupplier = async (id: string): Promise<void> => {
  return await supplierService.delete(id)
}

export const searchSuppliers = async (searchTerm: string): Promise<Supplier[]> => {
  return await supplierService.search(searchTerm)
}
