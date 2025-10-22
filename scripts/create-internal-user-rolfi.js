#!/usr/bin/env node

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, addDoc, getDocs, query, where } = require("firebase/firestore");

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

function randomPassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';
  let out = '';
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function createUser() {
  try {
    // Usar variables específicas para evitar colisión con USERNAME del sistema
    const username = process.env.ADMIN_USERNAME || process.env.USERNAME || 'rolfi';
    const name = process.env.ADMIN_NAME || process.env.NAME || 'Rolfi';
    const password = process.env.ADMIN_PASSWORD || process.env.PASSWORD || randomPassword(14);
    const email = process.env.ADMIN_EMAIL || process.env.EMAIL || '';

    const usersRef = collection(db, "internalUsers");

    // Verificar si ya existe
    const q = query(usersRef, where("username", "==", username));
    const existing = await getDocs(q);

    if (!existing.empty) {
      console.log(`⚠️ Usuario '${username}' ya existe en Firebase. No se creó uno nuevo.`);
      const existingUser = existing.docs[0].data();
      console.log("Usuario existente:", {
        username: existingUser.username,
        name: existingUser.name,
        role: existingUser.role,
        active: existingUser.active,
      });
      return;
    }

    const newUser = {
      name,
      username,
      email,
      password, // texto plano como espera authenticateInternalUser
      role: 'admin',
      active: true,
      permissions: DEFAULT_PERMISSIONS,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await addDoc(usersRef, newUser);

    console.log("\n✅ Usuario interno creado en Firebase:");
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log("   Role: admin");
    console.log("\n👉 Podés iniciar sesión en /auth/admin-login");
  } catch (err) {
    console.error("❌ Error creando usuario interno:", err);
    process.exit(1);
  }
}

createUser();
