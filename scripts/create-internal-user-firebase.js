#!/usr/bin/env node

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, where } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyDhkIfoobCjUqu6thb7AOQBTCSidII9aGU",
  authDomain: "altatelefonia-1e51b.firebaseapp.com",
  projectId: "altatelefonia-1e51b",
  storageBucket: "altatelefonia-1e51b.appspot.com",
  messagingSenderId: "724944708673",
  appId: "1:724944708673:web:874804815a39987d5652c0",
  measurementId: "G-V8DG4G138Z",
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const DEFAULT_PERMISSIONS = {
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
};

async function createInternalUser() {
  try {
    const usersRef = collection(db, "internalUsers");
    
    // Verificar si ya existe
    const q = query(usersRef, where("username", "==", "admin"));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      console.log("⚠️ Usuario 'admin' ya existe en Firebase");
      const existingUser = existing.docs[0].data();
      console.log("Usuario existente:", {
        username: existingUser.username,
        name: existingUser.name,
        role: existingUser.role,
        active: existingUser.active
      });
      return;
    }
    
    // Crear usuario admin
    const adminUser = {
      name: "Administrador",
      username: "admin",
      email: "admin@altatelefonia.com",
      password: "admin123", // Texto plano (como lo espera el servicio)
      role: "admin",
      active: true,
      permissions: DEFAULT_PERMISSIONS,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    await addDoc(usersRef, adminUser);
    
    console.log("\n✅ Usuario admin creado en Firebase:");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("   Role: admin");
    console.log("   Email: admin@altatelefonia.com");
    console.log("\n🔓 Puedes iniciar sesión en: http://localhost:3000/auth/admin-login");
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

createInternalUser();
