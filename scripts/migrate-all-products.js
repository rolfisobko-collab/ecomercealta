#!/usr/bin/env node

const { initializeApp, getApps, getApp } = require("firebase/app");
const { getFirestore, collection, getDocs } = require("firebase/firestore");
const mongoose = require("mongoose");

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

// Esquema de Producto
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  markdownDescription: { type: String },
  price: { type: Number, required: true, min: 0 },
  cost: { type: Number, min: 0 },
  currency: { type: String, default: 'USD' },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  category: { type: String, required: true },
  location: { type: String },
  obs: { type: String },
  images: [{ type: String }],
  image1: { type: String },
  image2: { type: String },
  image3: { type: String },
  image4: { type: String },
  image5: { type: String },
  youtubeVideoId: { type: String },
  youtubeUrl: { type: String },
  isInStock: { type: Boolean, default: function() { return this.quantity > 0 } },
  brand: { type: String },
  model: { type: String },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  lastManualUpdate: { type: Date }
}, { timestamps: true, collection: 'stock' });

const Product = mongoose.model('Product', ProductSchema);

async function migrateAllProducts() {
  console.log("🚀 MIGRACIÓN COMPLETA DE PRODUCTOS");
  console.log("==================================");
  
  try {
    // Conectar a MongoDB
    console.log('🔌 Conectando a MongoDB Atlas (test)...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
    });
    console.log("✅ Conectado a MongoDB Atlas - test");
    
    // Obtener TODOS los productos de Firebase SIN orderBy
    console.log("📥 Obteniendo TODOS los productos de Firebase...");
    const productsRef = collection(db, "stock");
    const querySnapshot = await getDocs(productsRef); // SIN orderBy para obtener todos
    
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
        lastManualUpdate: data.lastManualUpdate ? new Date(data.lastManualUpdate) : undefined,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
      };
    });

    console.log(`📦 Preparados ${products.length} productos para migrar`);
    
    // Limpiar colección existente
    console.log("🧹 Limpiando colección de productos en MongoDB...");
    await Product.deleteMany({});
    console.log("✅ Colección limpiada");
    
    // Insertar productos en lotes para evitar timeouts
    const BATCH_SIZE = 100;
    let totalInserted = 0;
    
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      await Product.insertMany(batch, { ordered: false });
      totalInserted += batch.length;
      console.log(`✅ Insertados ${totalInserted}/${products.length} productos`);
    }
    
    console.log("\n🎉 ¡MIGRACIÓN COMPLETADA EXITOSAMENTE!");
    console.log(`✅ Total de productos migrados: ${totalInserted}`);
    
    // Verificar
    const count = await Product.countDocuments();
    console.log(`✅ Productos en MongoDB: ${count}`);
    
  } catch (error) {
    console.error("❌ Error durante la migración:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Desconectado de MongoDB Atlas");
    process.exit(0);
  }
}

// Ejecutar migración
migrateAllProducts();
