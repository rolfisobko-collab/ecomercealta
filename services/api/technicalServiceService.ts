import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type {
  TechnicalService,
  CreateTechnicalServiceData,
  UpdateTechnicalServiceData,
  ServiceBrand,
  ServiceModel,
  CreateServiceBrandData,
  CreateServiceModelData,
  ServiceSpecification,
  CreateServiceSpecificationData,
  UpdateServiceSpecificationData,
  CreateServiceProductData,
} from "@/models/TechnicalService"

const SERVICES_COLLECTION = "technicalServices"
const BRANDS_COLLECTION = "serviceBrands"
const MODELS_COLLECTION = "serviceModels"
const SPECIFICATIONS_COLLECTION = "serviceSpecifications"
const SERVICE_PRODUCTS_COLLECTION = "serviceProducts"

class TechnicalServiceService {
  // Technical Services
  async create(data: CreateTechnicalServiceData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, SERVICES_COLLECTION), {
        ...data,
        isActive: data.isActive ?? true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating technical service:", error)
      throw error
    }
  } // <--- Added closing brace here

  async update(id: string, data: UpdateTechnicalServiceData): Promise<void> {
    try {
      const docRef = doc(db, SERVICES_COLLECTION, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error updating technical service:", error)
      throw error
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, SERVICES_COLLECTION, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Error deleting technical service:", error)
      throw error
    }
  }

  async getAll(): Promise<TechnicalService[]> {
    try {
      const q = query(collection(db, SERVICES_COLLECTION), orderBy("name"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastManualUpdate: doc.data().lastManualUpdate?.toDate(),
      })) as TechnicalService[]
    } catch (error) {
      console.error("Error getting technical services:", error)
      throw error
    }
  }

  async getById(id: string): Promise<TechnicalService | null> {
    try {
      const docRef = doc(db, SERVICES_COLLECTION, id)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        const data = docSnap.data()
        return {
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastManualUpdate: data.lastManualUpdate?.toDate(),
        } as TechnicalService
      }

      return null
    } catch (error) {
      console.error("Error getting technical service:", error)
      throw error
    }
  }

  onSnapshot(callback: (services: TechnicalService[]) => void) {
    const q = query(collection(db, SERVICES_COLLECTION), orderBy("name"))

    return onSnapshot(q, (querySnapshot) => {
      const services = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        lastManualUpdate: doc.data().lastManualUpdate?.toDate(),
      })) as TechnicalService[]

      callback(services)
    })
  }

  // Service Brands
  async createBrand(data: CreateServiceBrandData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, BRANDS_COLLECTION), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating service brand:", error)
      throw error
    }
  }

  async getAllBrands(): Promise<ServiceBrand[]> {
    try {
      const q = query(collection(db, BRANDS_COLLECTION), orderBy("name"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ServiceBrand[]
    } catch (error) {
      console.error("Error getting service brands:", error)
      throw error
    }
  }

  onBrandsSnapshot(callback: (brands: ServiceBrand[]) => void) {
    const q = query(collection(db, BRANDS_COLLECTION), orderBy("name"))

    return onSnapshot(q, (querySnapshot) => {
      const brands = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ServiceBrand[]

      callback(brands)
    })
  }

  async updateBrand(id: string, data: Partial<ServiceBrand>): Promise<void> {
    try {
      const docRef = doc(db, BRANDS_COLLECTION, id)
      await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() })
    } catch (error) {
      console.error("Error updating service brand:", error)
      throw error
    }
  }

  async deleteBrand(id: string): Promise<void> {
    try {
      const docRef = doc(db, BRANDS_COLLECTION, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Error deleting service brand:", error)
      throw error
    }
  }

  // Service Models
  async createModel(data: CreateServiceModelData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, MODELS_COLLECTION), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating service model:", error)
      throw error
    }
  }

  async getAllModels(): Promise<ServiceModel[]> {
    try {
      const q = query(collection(db, MODELS_COLLECTION), orderBy("name"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ServiceModel[]
    } catch (error) {
      console.error("Error getting service models:", error)
      throw error
    }
  }

  async getModelsByBrand(brandId: string): Promise<ServiceModel[]> {
    try {
      const q = query(collection(db, MODELS_COLLECTION), where("brandId", "==", brandId), orderBy("name"))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ServiceModel[]
    } catch (error) {
      console.error("Error getting service models by brand:", error)
      throw error
    }
  }

  onModelsSnapshot(callback: (models: ServiceModel[]) => void) {
    const q = query(collection(db, MODELS_COLLECTION), orderBy("name"))

    return onSnapshot(q, (querySnapshot) => {
      const models = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ServiceModel[]

      callback(models)
    })
  }

  async updateModel(id: string, data: Partial<ServiceModel>): Promise<void> {
    try {
      const docRef = doc(db, MODELS_COLLECTION, id)
      await updateDoc(docRef, { ...data, updatedAt: Timestamp.now() })
    } catch (error) {
      console.error("Error updating service model:", error)
      throw error
    }
  }

  async deleteModel(id: string): Promise<void> {
    try {
      const docRef = doc(db, MODELS_COLLECTION, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Error deleting service model:", error)
      throw error
    }
  }

  // Service Specifications
  async createSpecification(data: CreateServiceSpecificationData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, SPECIFICATIONS_COLLECTION), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error creating service specification:", error)
      throw error
    }
  }

  async updateSpecification(id: string, data: UpdateServiceSpecificationData): Promise<void> {
    try {
      const docRef = doc(db, SPECIFICATIONS_COLLECTION, id)
      await updateDoc(docRef, {
        ...data,
        updatedAt: Timestamp.now(),
      })
    } catch (error) {
      console.error("Error updating service specification:", error)
      throw error
    }
  }

  async getSpecificationsByService(serviceId: string): Promise<ServiceSpecification[]> {
    try {
      const q = query(collection(db, SPECIFICATIONS_COLLECTION), where("serviceId", "==", serviceId))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as ServiceSpecification[]
    } catch (error) {
      console.error("Error getting service specifications:", error)
      throw error
    }
  }

  // Service Products
  async addServiceProduct(data: CreateServiceProductData): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, SERVICE_PRODUCTS_COLLECTION), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })
      return docRef.id
    } catch (error) {
      console.error("Error adding service product:", error)
      throw error
    }
  }

  async removeServiceProduct(id: string): Promise<void> {
    try {
      const docRef = doc(db, SERVICE_PRODUCTS_COLLECTION, id)
      await deleteDoc(docRef)
    } catch (error) {
      console.error("Error removing service product:", error)
      throw error
    }
  }
}

export const technicalServiceService = new TechnicalServiceService()
