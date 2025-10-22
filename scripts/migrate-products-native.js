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

async function migrateAllProducts() {
  console.log("🚀 MIGRACIÓN COMPLETA DE PRODUCTOS (MongoDB Native Driver)");
  console.log("==========================================================");
  
  let mongoClient;
  
  try {
    // Conectar a MongoDB con el driver nativo
    console.log('🔌 Conectando a MongoDB Atlas (test)...');
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log("✅ Conectado a MongoDB Atlas - test");
    
    const mongodb = mongoClient.db('test');
    const stockCollection = mongodb.collection('stock');
    
    // Obtener TODOS los productos de Firebase
    console.log("📥 Obteniendo TODOS los productos de Firebase...");
    const productsRef = collection(db, "stock");
    const querySnapshot = await getDocs(productsRef);
    
    console.log(`📊 Encontrados ${querySnapshot.size} productos en Firebase`);
    
    const products = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        _id: doc.id,
        name: data.name || "",
        description: data.description || "",
        markdownDescription: data.markdownDescription || "",
        price: data.price || 0,
        cost: data.cost || 0,
        currency: data.currency || "USD",
        quantity: data.quantity || 0,
        category: data.category || "",
        location: data.location || "",
        obs: data.obs || "",
        images: data.images || [],
        image1: data.image1 || "",
        image2: data.image2 || "",
        image3: data.image3 || "",
        image4: data.image4 || "",
        image5: data.image5 || "",
        youtubeVideoId: data.youtubeVideoId || "",
        youtubeUrl: data.youtubeUrl || "",
        isInStock: (data.quantity || 0) > 0,
        brand: data.brand || "",
        model: data.model || "",
        discount: data.discount || 0,
        lastManualUpdate: data.lastManualUpdate ? new Date(data.lastManualUpdate) : null,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
    });

    console.log(`📦 Preparados ${products.length} productos para migrar`);
    
    // Limpiar colección existente
    console.log("🧹 Limpiando colección de productos en MongoDB...");
    await stockCollection.deleteMany({});
    console.log("✅ Colección limpiada");
    
    // Insertar productos en lotes
    const BATCH_SIZE = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      await stockCollection.insertMany(batch, { ordered: false });
      totalInserted += batch.length;
      console.log(`✅ Insertados ${totalInserted}/${products.length} productos`);
    }
    
    console.log("\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!");
    console.log(`✅ Total de productos migrados: ${totalInserted}`);
    
    // Verificar
    const count = await stockCollection.countDocuments();
    console.log(`✅ Productos en MongoDB: ${count}`);
    
    // Mostrar un ejemplo
    const example = await stockCollection.findOne();
    console.log("\n📋 Ejemplo de producto migrado:");
    console.log(`   Nombre: ${example.name}`);
    console.log(`   Precio: ${example.price}`);
    console.log(`   Cantidad: ${example.quantity}`);
    
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
migrateAllProducts();
