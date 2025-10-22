#!/usr/bin/env node

const { MongoClient } = require("mongodb");

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkStockTotal() {
  let mongoClient;
  
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db('test');
    
    const products = await db.collection('stock').find({}).toArray();
    
    console.log(`📦 Total productos: ${products.length}`);
    
    // Calcular total de unidades
    let totalUnits = 0;
    let productsWithStock = 0;
    let maxQuantity = 0;
    let productWithMaxQuantity = null;
    
    products.forEach(p => {
      const qty = p.quantity || 0;
      totalUnits += qty;
      
      if (qty > 0) productsWithStock++;
      
      if (qty > maxQuantity) {
        maxQuantity = qty;
        productWithMaxQuantity = p.name;
      }
    });
    
    console.log(`\n📊 Estadísticas de Stock:`);
    console.log(`   Total unidades: ${totalUnits.toLocaleString()}`);
    console.log(`   Productos con stock: ${productsWithStock}`);
    console.log(`   Productos sin stock: ${products.length - productsWithStock}`);
    console.log(`   Promedio por producto: ${Math.round(totalUnits / products.length)}`);
    console.log(`\n   Producto con más stock:`);
    console.log(`   - ${productWithMaxQuantity}`);
    console.log(`   - Cantidad: ${maxQuantity.toLocaleString()}`);
    
    // Ver algunos ejemplos
    console.log(`\n📋 Ejemplos de productos con mucho stock:`);
    const highStock = products
      .filter(p => (p.quantity || 0) > 100)
      .sort((a, b) => (b.quantity || 0) - (a.quantity || 0))
      .slice(0, 10);
    
    highStock.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name.substring(0, 50)} - ${p.quantity} unidades`);
    });
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (mongoClient) await mongoClient.close();
  }
}

checkStockTotal();
