#!/usr/bin/env node

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");

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

async function listUsers() {
  try {
    const usersRef = collection(db, "users");
    const querySnapshot = await getDocs(usersRef);
    
    console.log(`\n📋 USUARIOS EN FIREBASE (${querySnapshot.size}):\n`);
    
    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Usuario (ID: ${doc.id}):`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   DisplayName: ${data.displayName || 'N/A'}`);
      console.log(`   Role: ${data.role || 'N/A'}`);
      console.log(`   Username: ${data.username || 'N/A'}`);
      console.log(`   HashedPassword: ${data.hashedPassword ? 'Sí' : 'No'}`);
      if (data.hashedPassword) {
        console.log(`   Password Hash: ${data.hashedPassword.substring(0, 50)}...`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

listUsers();
