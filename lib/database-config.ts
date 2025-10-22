// Configuración para alternar entre Firebase y MongoDB
export const DATABASE_CONFIG = {
  // Cambiar a 'mongodb' para usar MongoDB Atlas
  // Cambiar a 'firebase' para usar Firebase
  provider: 'mongodb' as 'firebase' | 'mongodb',
  
  // Configuración de MongoDB
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0',
    db: process.env.MONGODB_DB || 'test'
  },
  
  // Configuración de Firebase (mantener para migración)
  firebase: {
    apiKey: "AIzaSyDhkIfoobCjUqu6thb7AOQBTCSidII9aGU",
    authDomain: "altatelefonia-1e51b.firebaseapp.com",
    projectId: "altatelefonia-1e51b",
    storageBucket: "altatelefonia-1e51b.appspot.com",
    messagingSenderId: "724944708673",
    appId: "1:724944708673:web:874804815a39987d5652c0",
    measurementId: "G-V8DG4G138Z",
  }
}

// Función para obtener el proveedor de base de datos actual
export function getDatabaseProvider(): 'firebase' | 'mongodb' {
  return DATABASE_CONFIG.provider
}

// Función para verificar si estamos usando MongoDB
export function isUsingMongoDB(): boolean {
  return getDatabaseProvider() === 'mongodb'
}

// Función para verificar si estamos usando Firebase
export function isUsingFirebase(): boolean {
  return getDatabaseProvider() === 'firebase'
}

