import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc, where, limit as fsLimit } from "firebase/firestore"

export interface Order {
  id: string
  customer: string
  date: string
  status: string
  total: number
  items: any[]
  createdAt: Date
}

export async function getOrders(userId?: string): Promise<Order[]> {
  try {
    const ordersRef = collection(db, "orders")
    const q = userId
      ? query(ordersRef, where("userId", "==", userId))
      : query(ordersRef, orderBy("createdAt", "desc"))
    const querySnapshot = await getDocs(q)

    const list = querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        customer: data.customer || "",
        date: data.date || new Date().toISOString().split("T")[0],
        status: data.status || "Pendiente",
        total: data.totalAmount || data.total || 0,
        items: data.items || [],
        createdAt: data.createdAt?.toDate?.() || new Date(),
      }
    })
    // Client-side sort when filtered by user (to avoid composite index)
    if (userId) {
      return list.sort((a, b) => (b.createdAt as any).getTime() - (a.createdAt as any).getTime())
    }
    return list
  } catch (error) {
    console.error("Error fetching orders:", error)
    return []
  }
}

export async function getOrder(id: string): Promise<Order | null> {
  try {
    const orderRef = doc(db, "orders", id)
    const orderDoc = await getDoc(orderRef)

    if (!orderDoc.exists()) {
      return null
    }

    const data = orderDoc.data()
    return {
      id: orderDoc.id,
      customer: data.customer || "",
      date: data.date || "",
      status: data.status || "Pendiente",
      total: data.totalAmount || data.total || 0,
      items: data.items || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      // Devolver todos los campos adicionales
      ...data,
    }
  } catch (error) {
    console.error("Error fetching order:", error)
    return null
  }
}

export async function createOrder(order: Omit<Order, "id">): Promise<string | null> {
  try {
    const ordersRef = collection(db, "orders")
    const newOrder = {
      ...order,
      createdAt: new Date(),
    }

    const docRef = await addDoc(ordersRef, newOrder)
    return docRef.id
  } catch (error) {
    console.error("Error creating order:", error)
    return null
  }
}

export async function updateOrder(id: string, order: Partial<Order>): Promise<boolean> {
  try {
    const orderRef = doc(db, "orders", id)
    await updateDoc(orderRef, order)
    return true
  } catch (error) {
    console.error("Error updating order:", error)
    return false
  }
}

export async function deleteOrder(id: string): Promise<boolean> {
  try {
    const orderRef = doc(db, "orders", id)
    await deleteDoc(orderRef)
    return true
  } catch (error) {
    console.error("Error deleting order:", error)
    return false
  }
}

export async function getRecentOrders(max = 5): Promise<Order[]> {
  try {
    const ordersRef = collection(db, "orders")
    const q = query(ordersRef, orderBy("createdAt", "desc"), fsLimit(max))
    const querySnapshot = await getDocs(q)

    return querySnapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        customer: data.customer || "",
        date: data.date || new Date().toISOString().split("T")[0],
        status: data.status || "Pendiente",
        total: data.total || 0,
        items: data.items || [],
        createdAt: data.createdAt?.toDate() || new Date(),
      }
    })
  } catch (error) {
    console.error("Error fetching recent orders:", error)
    return []
  }
}
