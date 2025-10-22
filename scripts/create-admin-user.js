#!/usr/bin/env node

const { MongoClient } = require("mongodb");
const crypto = require("crypto");

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

// Función simple de hash (la misma que usa passwordService.ts)
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function createAdminUser() {
  let mongoClient;
  
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log("✅ Conectado a MongoDB Atlas");
    
    const db = mongoClient.db('test');
    const usersCollection = db.collection('users');
    
    // Crear usuario admin
    const adminUser = {
      _id: 'admin-user-001',
      name: 'Admin',
      email: 'admin@altatelefonia.com',
      username: 'admin',
      hashedPassword: hashPassword('admin123'),
      role: 'admin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Verificar si ya existe
    const existing = await usersCollection.findOne({ email: adminUser.email });
    if (existing) {
      console.log("⚠️ Usuario admin ya existe, actualizando...");
      await usersCollection.updateOne(
        { email: adminUser.email },
        { $set: adminUser }
      );
    } else {
      await usersCollection.insertOne(adminUser);
    }
    
    console.log("\n✅ Usuario admin creado/actualizado:");
    console.log("   Email: admin@altatelefonia.com");
    console.log("   Username: admin");
    console.log("   Password: admin123");
    console.log("   Role: admin");
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

createAdminUser();
