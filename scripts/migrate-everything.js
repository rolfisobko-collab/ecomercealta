#!/usr/bin/env node

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const { MongoClient } = require("mongodb");

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDhkIfoobCjUqu6thb7AOQBTCSidII9aGU",
  authDomain: "altatelefonia-1e51b.firebaseapp.com",
  projectId: "altatelefonia-1e51b",
  storageBucket: "altatelefonia-1e51b.appspot.com",
  messagingSenderId: "724944708673",
  appId: "1:724944708673:web:874804815a39987d5652c0",
  measurementId: "G-V8DG4G138Z",
};

// Configuración de MongoDB
const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

async function migrateCollection(firebaseCollectionName, mongoCollectionName, mongoDb) {
  console.log(`\n🔄 Migrando ${firebaseCollectionName}...`);
  
  try {
    const collectionRef = collection(db, firebaseCollectionName);
    const querySnapshot = await getDocs(collectionRef);
    
    console.log(`📊 Encontrados ${querySnapshot.size} documentos en Firebase`);
    
    if (querySnapshot.size === 0) {
      console.log(`ℹ️ No hay documentos para migrar en ${firebaseCollectionName}`);
      return 0;
    }
    
    const documents = querySnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convertir Timestamps de Firebase a Dates de JavaScript
      const convertedData = { ...data };
      Object.keys(convertedData).forEach(key => {
        if (convertedData[key] && typeof convertedData[key] === 'object') {
          // Si es un Timestamp de Firestore
          if (convertedData[key].toDate && typeof convertedData[key].toDate === 'function') {
            convertedData[key] = convertedData[key].toDate();
          }
          // Si es un objeto con seconds y nanoseconds (formato serializado)
          else if (convertedData[key].seconds !== undefined) {
            convertedData[key] = new Date(convertedData[key].seconds * 1000);
          }
        }
      });
      
      return {
        _id: doc.id,
        ...convertedData
      };
    });
    
    const mongoCollection = mongoDb.collection(mongoCollectionName);
    
    // Limpiar colección existente
    await mongoCollection.deleteMany({});
    
    // Insertar en lotes
    const BATCH_SIZE = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      await mongoCollection.insertMany(batch, { ordered: false });
      totalInserted += batch.length;
      console.log(`✅ Insertados ${totalInserted}/${documents.length} documentos`);
    }
    
    console.log(`✅ Migración de ${firebaseCollectionName} completada: ${totalInserted} documentos`);
    return totalInserted;
    
  } catch (error) {
    console.error(`❌ Error migrando ${firebaseCollectionName}:`, error);
    return 0;
  }
}

async function migrateEverything() {
  console.log("🚀 MIGRACIÓN COMPLETA DE FIREBASE A MONGODB");
  console.log("==========================================\n");
  
  let mongoClient;
  const stats = {};
  
  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB Atlas...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log("✅ Conectado a MongoDB Atlas - test\n");
    
    const mongodb = mongoClient.db('test');
    
    // Migrar todas las colecciones
    const collections = [
      { firebase: 'users', mongo: 'users' },
      { firebase: 'stock', mongo: 'stock' },
      { firebase: 'stockCategories', mongo: 'stockCategories' },
      { firebase: 'suppliers', mongo: 'suppliers' },
      { firebase: 'movements', mongo: 'movements' },
      { firebase: 'favorites', mongo: 'favorites' },
      { firebase: 'technicalServices', mongo: 'technicalServices' },
      { firebase: 'transactions', mongo: 'transactions' },
      { firebase: 'cashTransactions', mongo: 'cashTransactions' },
      { firebase: 'cashClosings', mongo: 'cashClosings' },
      { firebase: 'cashBalances', mongo: 'cashBalances' },
      { firebase: 'sales', mongo: 'sales' },
      { firebase: 'orders', mongo: 'orders' },
      { firebase: 'internalUsers', mongo: 'internalUsers' },
    ];
    
    for (const col of collections) {
      const count = await migrateCollection(col.firebase, col.mongo, mongodb);
      stats[col.firebase] = count;
    }
    
    // Resumen
    console.log("\n\n📊 RESUMEN DE MIGRACIÓN COMPLETA:");
    console.log("=".repeat(50));
    
    let total = 0;
    Object.entries(stats).forEach(([collection, count]) => {
      const status = count > 0 ? '✅' : '⚠️';
      console.log(`${status} ${collection}: ${count} documentos`);
      total += count;
    });
    
    console.log("=".repeat(50));
    console.log(`📈 TOTAL: ${total} documentos migrados`);
    
    console.log("\n🎉 ¡MIGRACIÓN COMPLETA EXITOSA!");
    
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    process.exit(1);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
      console.log("\n🔌 Desconectado de MongoDB Atlas");
    }
    process.exit(0);
  }
}

// Ejecutar migración
migrateEverything();
