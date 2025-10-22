#!/usr/bin/env node

const { MongoClient } = require("mongodb");

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function checkDataStructure() {
  let mongoClient;
  
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    const db = mongoClient.db('test');
    
    console.log("📊 ESTRUCTURA DE DATOS EN MONGODB\n");
    
    // Transacciones de caja
    console.log("=== CASH TRANSACTIONS ===");
    const transaction = await db.collection('cashTransactions').findOne();
    console.log(JSON.stringify(transaction, null, 2));
    
    console.log("\n=== SALES ===");
    const sale = await db.collection('sales').findOne();
    console.log(JSON.stringify(sale, null, 2));
    
    console.log("\n=== TRANSACTIONS ===");
    const trans = await db.collection('transactions').findOne();
    console.log(JSON.stringify(trans, null, 2));
    
    console.log("\n=== CASH CLOSINGS ===");
    const closing = await db.collection('cashClosings').findOne();
    console.log(JSON.stringify(closing, null, 2));
    
    console.log("\n=== TECHNICAL SERVICES ===");
    const service = await db.collection('technicalServices').findOne();
    console.log(JSON.stringify(service, null, 2));
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    if (mongoClient) await mongoClient.close();
  }
}

checkDataStructure();
