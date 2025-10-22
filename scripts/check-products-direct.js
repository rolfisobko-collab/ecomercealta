#!/usr/bin/env node

const mongoose = require("mongoose");

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkProducts() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Conectado a MongoDB Atlas");
    
    const db = mongoose.connection.db;
    
    // Listar todas las colecciones
    const collections = await db.listCollections().toArray();
    console.log("\n📋 Colecciones disponibles:");
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    // Contar documentos en la colección 'stock'
    const stockCount = await db.collection('stock').countDocuments();
    console.log(`\n📊 Documentos en 'stock': ${stockCount}`);
    
    // Obtener un ejemplo
    if (stockCount > 0) {
      const example = await db.collection('stock').findOne();
      console.log("\n📋 Ejemplo de producto:");
      console.log(JSON.stringify(example, null, 2));
    }
    
    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

checkProducts();
