// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app"
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED,
} from "firebase/firestore"
import { getStorage } from "firebase/storage"
import { getAuth } from "firebase/auth"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDhkIfoobCjUqu6thb7AOQBTCSidII9aGU",
  authDomain: "altatelefonia-1e51b.firebaseapp.com",
  projectId: "altatelefonia-1e51b",
  storageBucket: "altatelefonia-1e51b.appspot.com",
  messagingSenderId: "724944708673",
  appId: "1:724944708673:web:874804815a39987d5652c0",
  measurementId: "G-V8DG4G138Z",
}

// Initialize Firebase (solo si no está ya inicializado)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()

// Initialize Firestore with multi-tab support
// Verificar si ya existe una instancia de Firestore
let db
try {
  // Intentar obtener la instancia existente primero
  db = getFirestore(app)
} catch (e) {
  // Si no existe, inicializar con las opciones
  db = initializeFirestore(app, {
    // Usar caché local persistente con soporte para múltiples pestañas
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    }),
  })
}

export { db }

// Initialize Firebase Storage with explicit bucket
export const storage = getStorage(app)

// Initialize Firebase Authentication
export const auth = getAuth(app)

export default app
