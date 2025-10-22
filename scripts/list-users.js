#!/usr/bin/env node

const { MongoClient } = require("mongodb");

const MONGODB_URI = 'mongodb+srv://leandrosobko_db_user:39kokOttcCd8gZn1@cluster0.qkjc22r.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0';

async function listUsers() {
  let mongoClient;
  
  try {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
    console.log("✅ Conectado a MongoDB Atlas");
    
    const db = mongoClient.db('test');
    const users = await db.collection('users').find({}).toArray();
    
    console.log(`\n📋 USUARIOS EN MONGODB (${users.length}):\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Usuario:`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Active: ${user.active}`);
      console.log(`   HashedPassword: ${user.hashedPassword ? 'Sí (hash presente)' : 'No'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
}

listUsers();
