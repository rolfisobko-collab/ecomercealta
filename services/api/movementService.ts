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
import type { Movement, MovementFormData, MovementItem } from "@/models/Movement"
import { productService } from "./productService"

const COLLECTION_NAME = "movements"

class MovementService {
  async getAll(): Promise<Movement[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as Movement
      })
    } catch (error) {
      console.error("Error getting movements:", error)
      throw error
    }
  }

  async getById(id: string): Promise<Movement | null> {
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
        date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
      } as Movement
    } catch (error) {
      console.error("Error getting movement:", error)
      throw error
    }
  }

  async create(formData: MovementFormData, userId: string): Promise<string> {
    try {
      // Calculate total amount
      const totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)

      const newMovement: Omit<Movement, "id"> = {
        ...formData,
        totalAmount,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        createdBy: userId,
      }

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newMovement)

      // Update product quantities
      await this.updateProductQuantities(formData.items, formData.type)

      return docRef.id
    } catch (error) {
      console.error("Error creating movement:", error)
      throw error
    }
  }

  async update(id: string, formData: Partial<MovementFormData>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id)

      // Get the current movement to compare items
      const currentMovement = await this.getById(id)
      if (!currentMovement) {
        throw new Error("Movement not found")
      }

      // If items have changed, we need to revert the old quantity changes and apply the new ones
      if (formData.items && JSON.stringify(formData.items) !== JSON.stringify(currentMovement.items)) {
        // Revert old quantity changes
        await this.updateProductQuantities(currentMovement.items, this.getOppositeMovementType(currentMovement.type))

        // Apply new quantity changes
        await this.updateProductQuantities(formData.items, formData.type || currentMovement.type)
      }

      // Calculate new total amount if items have changed
      const updateData: any = {
        ...formData,
        updatedAt: serverTimestamp(),
      }

      if (formData.items) {
        updateData.totalAmount = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)
      }

      await updateDoc(docRef, updateData)
    } catch (error) {
      console.error("Error updating movement:", error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      // Get the movement to revert quantity changes
      const movement = await this.getById(id)
      if (!movement) {
        throw new Error("Movement not found")
      }

      // Revert quantity changes
      await this.updateProductQuantities(movement.items, this.getOppositeMovementType(movement.type))

      // Delete the document
      const docRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Error deleting movement:", error)
      throw error
    }
  }

  async getByType(type: string): Promise<Movement[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("type", "==", type), orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as Movement
      })
    } catch (error) {
      console.error(`Error getting movements by type ${type}:`, error)
      throw error
    }
  }

  async getBySupplier(supplierId: string): Promise<Movement[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), where("supplierId", "==", supplierId), orderBy("date", "desc"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          date: data.date instanceof Timestamp ? data.date.toDate() : data.date,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
        } as Movement
      })
    } catch (error) {
      console.error(`Error getting movements by supplier ${supplierId}:`, error)
      throw error
    }
  }

  private async updateProductQuantities(items: MovementItem[], type: string): Promise<void> {
    try {
      for (const item of items) {
        const product = await productService.getById(item.productId)
        if (!product) continue

        let newQuantity = product.quantity

        switch (type) {
          case "purchase":
          case "stock_in":
            newQuantity += item.quantity
            break
          case "stock_out":
            newQuantity -= item.quantity
            break
        }

        // Ensure quantity doesn't go below zero
        newQuantity = Math.max(0, newQuantity)

        await productService.update(item.productId, { quantity: newQuantity })
      }
    } catch (error) {
      console.error("Error updating product quantities:", error)
      throw error
    }
  }

  private getOppositeMovementType(type: string): string {
    switch (type) {
      case "purchase":
      case "stock_in":
        return "stock_out"
      case "stock_out":
        return "stock_in"
      default:
        return type
    }
  }
}

export const movementService = new MovementService()
