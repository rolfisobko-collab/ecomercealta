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

async function listInternalUsers() {
  try {
    const usersRef = collection(db, "internalUsers");
    const querySnapshot = await getDocs(usersRef);
    
    console.log(`\n📋 USUARIOS INTERNOS EN FIREBASE (${querySnapshot.size}):\n`);
    
    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      console.log(`${index + 1}. Usuario (ID: ${doc.id}):`);
      console.log(`   Username: ${data.username}`);
      console.log(`   Name: ${data.name}`);
      console.log(`   Email: ${data.email || 'N/A'}`);
      console.log(`   Password: ${data.password || 'N/A'}`);
      console.log(`   Role: ${data.role}`);
      console.log(`   Active: ${data.active}`);
      console.log('');
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

listInternalUsers();
