#!/usr/bin/env node

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, where, doc, updateDoc } = require("firebase/firestore");

// Usa la misma config que el proyecto
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

async function ensureAdmin() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const email = process.env.ADMIN_EMAIL || 'admin@altatelefonia.com';

  try {
    const usersRef = collection(db, "internalUsers");
    const q = query(usersRef, where("username", "==", username));
    const existing = await getDocs(q);

    if (existing.empty) {
      await addDoc(usersRef, {
        name: "Administrador",
        username,
        email,
        password, // texto plano como espera authenticateInternalUser
        role: "admin",
        active: true,
        permissions: DEFAULT_PERMISSIONS,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Usuario '${username}' creado con password '${password}'.`);
    } else {
      const docSnap = existing.docs[0];
      const ref = doc(db, "internalUsers", docSnap.id);
      await updateDoc(ref, {
        password,
        active: true,
        role: "admin",
        updatedAt: new Date(),
      });
      console.log(`✅ Usuario '${username}' actualizado con password '${password}' y active=true.`);
    }

    console.log("👉 Probá login en /auth/admin-login con esas credenciales.");
  } catch (err) {
    console.error("❌ Error asegurando admin:", err);
    process.exit(1);
  }
}

ensureAdmin();
